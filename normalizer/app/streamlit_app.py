import streamlit as st
import pandas as pd
import io
import os
from geo_processor import *

st.set_page_config(page_title="CSV正規化ツール", layout="wide")

# --- サイドバー: 設定項目 ---
st.sidebar.title("設定")
sleep_msec = st.sidebar.number_input("APIリクエスト間隔（ミリ秒）", min_value=0, max_value=5000, value=200, step=10)
normalize_digits = st.sidebar.checkbox("漢数字をアラビア数字に変換", value=False)
st.sidebar.markdown("---")
st.sidebar.subheader("2重APIチェック設定")
gsi_check = st.sidebar.checkbox("Google＋国土地理院API両方を使う", value=True)
gsi_distance = st.sidebar.number_input("座標ズレ閾値（メートル）", value=200, min_value=0, max_value=10000, step=10)
priority = st.sidebar.selectbox("閾値超時に優先するAPI", options=["gsi", "google"], format_func=lambda x: "国土地理院" if x=="gsi" else "Google")

st.title("📍 CSV正規化ツール")
st.write("ポスター掲示場所等のCSVを正規化し、Google Maps APIを使って緯度経度を付与します。国土地理院APIで2重チェックできます。")

st.header("1. CSVファイルをアップロード")
csv_file = st.file_uploader("CSVファイルを選択してください", type=["csv"])
df = None
filename = ""
if csv_file is not None:
    df = pd.read_csv(csv_file)
    st.success(f"CSVファイルを読み込みました（{len(df)}行のデータ）")
    st.subheader("データプレビュー")
    # プレビュー時のみインデックス1始まりで表示
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
if csv_file is not None:
    col_names = df.columns.tolist()
    pref_val, city_val = guess_pref_city_vals(col_names, df, filename)
    number_col_guess = next((c for c in col_names if "番号" in c or "No" in c or "NO" in c or "no" in c or "num" in c), col_names[0] if col_names else "")
    addr_col_guess = next((c for c in col_names if "住" in c), col_names[0] if col_names else "")
    name_col_guess = next((c for c in col_names if "名" in c), col_names[1] if len(col_names) > 1 else "")
    # 都道府県名を推測する
    addr_right = extract_address_like_text_from_last_row(df)
    pref_val = get_prefecture_from_partial_address(city_val + addr_right)

st.header("2. 設定を構成")
pref_val = st.text_input("都道府県（prefecture: 固定値）", value=pref_val)
city_val = st.text_input("市区町村（city: 固定値）", value=city_val)
number_col = st.selectbox("番号列（number）", col_names, index=col_names.index(number_col_guess) if number_col_guess in col_names else 0)
addr_col = st.selectbox("住所列（address）", col_names, index=col_names.index(addr_col_guess) if addr_col_guess in col_names else 0)
name_col = st.selectbox("名称列（name）", col_names, index=col_names.index(name_col_guess) if name_col_guess in col_names else 0)

output_candidates = ["number", "address", "name", "lat", "long"]
default_outputs = ["number", "address", "name", "lat", "long"]
output_columns = st.multiselect(
    "出力する列を選択してください",
    output_candidates,
    default=default_outputs
)

st.header("3. 処理を実行")
log_lines = []
log_box = st.empty()
warning_count = 0
progress_bar = st.progress(0)
status_text = st.empty()

def log_callback(msg):
    global warning_count
    msg = str(msg)
    log_lines.append(msg)
    if msg.startswith("警告"):
        warning_count += 1
    log_box.text_area("ログ", "\n".join(log_lines[-500:]), height=300, key=f"log-{len(log_lines)}")

def progress_callback(idx, total):
    progress_bar.progress(idx / total)
    status_text.text(f"処理中: {idx} / {total} 行")

if st.button("CSV正規化を実行"):
    if df is not None:
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
            
            results = process_csv_data(
                csv_data,
                config,
                progress_callback=progress_callback,
                log_callback=log_callback,
                gsi_check=gsi_check,
                gsi_distance=int(gsi_distance),
                priority=priority
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
            msg = "処理完了！出力データをダウンロードできます"
            if warning_count > 0:
                msg += f"。変換中に {warning_count} 件の警告が発生しました。"
            st.success(msg)
            
            # ---出力プレビューもインデックス1始まりで---
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
        except Exception as e:
            st.error(f"エラー: {str(e)}")
    else:
        st.warning("CSVファイルをアップロードしてください。")
