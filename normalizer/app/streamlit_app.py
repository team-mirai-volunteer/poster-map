import streamlit as st
import pandas as pd
import io
import os
import requests
from geo_processor import (
    process_csv_data,
    extract_address_like_text_from_last_row,
    get_prefecture_from_partial_address
)

st.set_page_config(page_title="CSV正規化ツール", layout="wide")

st.sidebar.title("設定")
sleep_msec = st.sidebar.number_input("APIリクエスト間隔（ミリ秒）", min_value=0, max_value=5000, value=200, step=10)
normalize_digits = st.sidebar.checkbox("漢数字をアラビア数字に変換", value=False)
st.sidebar.markdown("---")
st.sidebar.subheader("座標検証設定")
mode = st.sidebar.selectbox(
    "検証モード", 
    options=["distance", "reverse_geocode", "google_only", "gsi_only", "jageocoder_only"], 
    format_func=lambda x: {
        "distance": "距離チェック",
        "reverse_geocode": "逆引きチェック", 
        "google_only": "Googleのみ使用",
        "gsi_only": "国土地理院のみ使用",
        "jageocoder_only": "Jageocoderのみ使用"
    }.get(x, x),
    help="距離チェック：複数のAPIの座標を比較して品質を検証\n逆引きチェック：逆ジオコーディングで住所を検証\nGoogleのみ：Google Maps APIのみ使用\n国土地理院のみ：国土地理院APIのみ使用\nJageocoderのみ：Jageocoder APIのみ使用"
)

if mode == "distance":
    st.sidebar.markdown("**距離チェック設定**")
    gsi_check = st.sidebar.checkbox("国土地理院APIを使う", value=True)
    jageocoder_check = st.sidebar.checkbox("Jageocoder APIを使う", value=False)
    gsi_distance = st.sidebar.number_input("座標ズレ閾値（メートル）", value=200, min_value=0, max_value=10000, step=10)
    priority_options = ["google"]
    priority_format = {"google": "Google"}
    if gsi_check:
        priority_options.append("gsi")
        priority_format["gsi"] = "国土地理院"
    if jageocoder_check:
        priority_options.append("jageocoder")
        priority_format["jageocoder"] = "Jageocoder"
    priority = st.sidebar.selectbox("閾値超時に優先するAPI", options=priority_options, format_func=lambda x: priority_format[x])
    reverse_geocode_check = False
    google_reverse_check = True
elif mode == "reverse_geocode":
    st.sidebar.markdown("**逆引きチェック設定**")
    st.sidebar.info("取得した座標を逆引きして住所の一致を確認します。")
    reverse_geocode_check = True
    google_reverse_check = st.sidebar.checkbox("Google APIを使う", value=True, help="Google Mapsの逆ジオコーディングで住所を検証します")
    jageocoder_check = st.sidebar.checkbox("Jageocoder APIを使う", value=False, help="Jageocoderの逆ジオコーディングで住所を検証します")
    gsi_check = True
    gsi_distance = 200
    priority_options = ["google", "gsi", "jageocoder"]
    priority_format = {"google": "Google", "gsi": "国土地理院", "jageocoder": "Jageocoder"}
    priority = st.sidebar.selectbox("逆引き不一致時に採用するAPI", options=priority_options, format_func=lambda x: priority_format[x], help="すべての逆引きが不一致の場合に使用するAPIを選択")
elif mode == "google_only":
    st.sidebar.markdown("**Googleのみ使用設定**")
    st.sidebar.info("Google Geocoding APIのみで座標を取得します。")
    gsi_check = False
    jageocoder_check = False
    gsi_distance = 200
    priority = "google"
    reverse_geocode_check = False
    google_reverse_check = True
elif mode == "gsi_only":
    st.sidebar.markdown("**国土地理院のみ使用設定**")
    st.sidebar.info("国土地理院APIのみで座標を取得します。APIキーは不要です。")
    gsi_check = True
    jageocoder_check = False
    gsi_distance = 200
    priority = "gsi"
    reverse_geocode_check = False
    google_reverse_check = False
else:
    st.sidebar.markdown("**Jageocoderのみ使用設定**")
    st.sidebar.info("Jageocoder APIのみで座標を取得します。APIキーは不要です。")
    gsi_check = False
    jageocoder_check = True
    gsi_distance = 200
    priority = "jageocoder"
    reverse_geocode_check = False
    google_reverse_check = False

st.title("📍 CSV正規化ツール")
st.write("ポスター掲示場所等のCSVを正規化し、選択したAPIを使って緯度経度を付与します。複数のAPIで座標の品質を検証することもできます。")

st.header("1. CSVファイルをアップロード")
csv_file = st.file_uploader("CSVファイルを選択してください", type=["csv"])
df = None
filename = ""
if csv_file is not None:
    df = pd.read_csv(csv_file)
    st.success(f"CSVファイルを読み込みました（{len(df)}行のデータ）")
    st.subheader("データプレビュー")
    df_view = df.copy()
    df_view.index = df_view.index + 1
    st.dataframe(df_view, height=400)
    if hasattr(csv_file, "name"):
        filename = csv_file.name
    elif isinstance(csv_file, str):
        filename = os.path.basename(csv_file)
    else:
        filename = ""

def guess_pref_city_vals(col_names, df, filename):
    pref_candidates = [c for c in col_names if any(x in c for x in ["都", "道", "府", "県"])]
    city_candidates = [c for c in col_names if any(x in c for x in ["市", "区", "町", "村"])]
    pref = ""
    city = ""
    if pref_candidates:
        pref_col = pref_candidates[0]
        pref = df[pref_col].iloc[0] if df is not None and pref_col in df.columns else ""
    filename_city = ""
    for token in ["市", "区", "町", "村"]:
        if token in filename:
            filename_city = filename.split(token)[0] + token
            break
    if filename_city:
        city = filename_city
    elif city_candidates:
        city_col = city_candidates[0]
        city = df[city_col].iloc[0] if df is not None and city_col in df.columns else ""
    return pref, city

pref_val = ""
city_val = ""
number_col_guess = ""
addr_col_guess = ""
name_col_guess = ""

col_names = []
if csv_file is not None and df is not None:
    col_names = df.columns.tolist()
    pref_val, city_val = guess_pref_city_vals(col_names, df, filename)
    
    col_names_lower = [c.lower() for c in col_names]
    
    if "number" in col_names_lower:
        number_col_guess = col_names[col_names_lower.index("number")]
    else:
        number_col_guess = next((c for c in col_names if "番号" in c or "number" in c.lower() or "no" in c.lower() or "num" in c.lower()), col_names[0] if col_names else "")
    
    if "address" in col_names_lower:
        addr_col_guess = col_names[col_names_lower.index("address")]
    else:
        addr_col_guess = next((c for c in col_names if "住所" in c or "address" in c.lower() or "住" in c or "所在地" in c), col_names[0] if col_names else "")
    
    if "name" in col_names_lower:
        name_col_guess = col_names[col_names_lower.index("name")]
    else:
        name_col_guess = next((c for c in col_names if "名称" in c or "name" in c.lower() or "名" in c or "施設" in c), col_names[1] if len(col_names) > 1 else "")
    
    addr_right = extract_address_like_text_from_last_row(df)
    pref_val = get_prefecture_from_partial_address(city_val + addr_right, use_gsi=(mode != "google_only"))

st.header("2. 設定を構成")
pref_val = st.text_input("都道府県（prefecture: 固定値）", value=pref_val)
city_val = st.text_input("市区町村（city: 固定値）", value=city_val)
number_col = st.selectbox("番号列（number）", col_names if col_names else [""], index=col_names.index(number_col_guess) if number_col_guess in col_names else 0)
addr_col = st.selectbox("住所列（address）", col_names if col_names else [""], index=col_names.index(addr_col_guess) if addr_col_guess in col_names else 0)
name_col = st.selectbox("名称列（name）", col_names if col_names else [""], index=col_names.index(name_col_guess) if name_col_guess in col_names else 0)

output_candidates = ["number", "address", "name", "lat", "long", "note"]
default_outputs = ["number", "address", "name", "lat", "long", "note"]
output_columns = st.multiselect(
    "出力する列を選択してください",
    output_candidates,
    default=default_outputs,
    help="note列：座標の品質情報（怪しい場合に「緯度経度は怪しい」と表示）"
)

st.header("3. 処理を実行")

button_disabled = False
validation_message = ""

if mode == "distance" and not gsi_check and not jageocoder_check:
    button_disabled = True
    validation_message = "⚠️ 距離チェックモードでは、「国土地理院APIを使う」または「Jageocoder APIを使う」のいずれかにチェックを入れてください。"
elif mode == "reverse_geocode" and not google_reverse_check and not jageocoder_check:
    button_disabled = True
    validation_message = "⚠️ 逆引きチェックモードでは、「Google APIを使う」または「Jageocoder APIを使う」のいずれかにチェックを入れてください。"

if validation_message:
    st.warning(validation_message)

if 'log_lines' not in st.session_state:
    st.session_state.log_lines = []
if 'warning_count' not in st.session_state:
    st.session_state.warning_count = 0

log_box = st.empty()
progress_bar = st.progress(0)
status_text = st.empty()

def log_callback(msg):
    msg = str(msg)
    st.session_state.log_lines.append(msg)
    if msg.startswith("警告"):
        st.session_state.warning_count += 1
    log_box.text_area("ログ", "\n".join(str(line) for line in st.session_state.log_lines[-500:]), height=300, key=f"log-{len(st.session_state.log_lines)}")

def progress_callback(idx, total):
    progress_bar.progress(idx / total)
    status_text.text(f"処理中: {idx} / {total} 行")

if st.button("CSV正規化を実行", disabled=button_disabled):
    st.session_state.log_lines = []
    st.session_state.warning_count = 0
    
    if df is not None:
        if "lat" in output_columns or "long" in output_columns:
            if mode not in ["gsi_only", "jageocoder_only"] and not os.environ.get("GOOGLE_MAPS_API_KEY"):
                st.error("Google Maps APIキーが設定されていません。環境変数 GOOGLE_MAPS_API_KEY を設定してください。")
                st.stop()
        try:
            colmap = {col: idx for idx, col in enumerate(df.columns)}
            config = {
                "format": {},
                "api": {
                    "sleep": sleep_msec
                },
                "normalize_address_digits": normalize_digits
            }
            for col in output_columns:
                if col == "number":
                    config["format"]["number"] = f"{{{colmap[number_col]+1}}}"
                elif col == "address":
                    config["format"]["address"] = f"{{{colmap[addr_col]+1}}}"
                elif col == "name":
                    config["format"]["name"] = f"{{{colmap[name_col]+1}}}"
                elif col == "lat":
                    config["format"]["lat"] = "{lat}"
                elif col == "long":
                    config["format"]["long"] = "{long}"

            config["format"]["prefecture"] = pref_val
            config["format"]["city"] = city_val

            csv_data = df.values.tolist()
            
            info_placeholder = st.empty()
            info_placeholder.info("処理中…しばらくお待ちください")
            
            actual_mode = mode
            
            results = process_csv_data(
                csv_data,
                config,
                progress_callback=progress_callback,
                log_callback=log_callback,
                gsi_check=gsi_check,
                gsi_distance=int(gsi_distance),
                priority=priority,
                mode=actual_mode,
                reverse_geocode_check=reverse_geocode_check,
                jageocoder_check=jageocoder_check,
                google_reverse_check=google_reverse_check
            )
            
            output_header = ["prefecture", "city"] + list(output_columns)
            out_df = pd.DataFrame(
                [
                    [row[results[0].index("prefecture")], row[results[0].index("city")]]
                    + [row[results[0].index(col)] for col in output_columns]
                    for row in results[1:]
                ],
                columns=output_header
            )
            
            progress_bar.progress(1.0)
            status_text.text("完了")
            info_placeholder.empty()
            
            # 「緯度経度は怪しい」のカウント
            total_rows = len(out_df)
            suspicious_count = 0
            if "note" in out_df.columns:
                suspicious_count = sum(1 for note in out_df["note"] if "緯度経度は怪しい" in str(note))
            
            msg = f"処理完了！{total_rows}件中{suspicious_count}件({suspicious_count/total_rows*100:.1f}%)が緯度経度は怪しいとなりました。出力データをダウンロードできます"
            if st.session_state.warning_count > 0:
                msg += f"。変換中に {st.session_state.warning_count} 件の警告が発生しました。"
            st.success(msg)
            
            out_df_view = out_df.copy()
            out_df_view.index = out_df_view.index + 1
            st.dataframe(out_df_view, height=400)
            csv_buf = io.StringIO()
            out_df.to_csv(csv_buf, index=False)
            st.download_button(
                "結果CSVをダウンロード",
                data=csv_buf.getvalue(),
                file_name=f"{city_val}_normalized.csv",
                mime="text/csv"
            )
        except requests.exceptions.RequestException as e:
            st.error(f"API通信エラー: {str(e)}")
            st.info("ネットワーク接続を確認してください。")
        except ValueError as e:
            st.error(f"データ処理エラー: {str(e)}")
            st.info("CSVデータの形式を確認してください。")
        except Exception as e:
            st.error(f"予期しないエラー: {str(e)}")
            st.info("詳細はログを確認してください。")
    else:
        st.warning("CSVファイルをアップロードしてください。")
