import streamlit as st
import pandas as pd
import csv
import io
import os
from typing import Dict, List, Any
from dotenv import load_dotenv

from geo_processor import process_csv_data, create_config_from_params
from config_manager import ConfigManager

load_dotenv()

st.set_page_config(
    page_title="CSV正規化ツール",
    page_icon="📍",
    layout="wide"
)

def main():
    st.title("📍 CSV正規化ツール")
    st.markdown("ポスター掲示場情報のCSVを正規化し、Google Mapsを使って緯度経度を付与します。")
    
    config_manager = ConfigManager()
    
    with st.sidebar:
        st.header("設定")
        
        api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        
        sleep_ms = st.slider(
            "APIコール間隔 (ミリ秒)",
            min_value=100,
            max_value=2000,
            value=200,
            step=50,
            help="Google Maps APIの利用制限を避けるための待機時間"
        )
        
        normalize_digits = st.checkbox(
            "漢数字をアラビア数字に変換",
            value=False,
            help="住所の漢数字（二丁目など）をアラビア数字（2丁目）に変換します"
        )
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.header("1. CSVファイルをアップロード")
        uploaded_file = st.file_uploader(
            "CSVファイルを選択してください",
            type=['csv'],
            help="ポスター掲示場情報が含まれるCSVファイルをアップロードしてください"
        )
        
        if uploaded_file is not None:
            try:
                content = uploaded_file.read().decode('utf-8')
                csv_reader = csv.reader(io.StringIO(content))
                csv_data = list(csv_reader)
                
                if len(csv_data) > 0:
                    st.success(f"✅ CSVファイルを読み込みました ({len(csv_data)-1}行のデータ)")
                    
                    df_preview = pd.DataFrame(csv_data[1:], columns=csv_data[0])
                    st.subheader("データプレビュー")
                    st.dataframe(df_preview.head(10), use_container_width=True)
                    
                    st.session_state['csv_data'] = csv_data
                    st.session_state['columns'] = csv_data[0]
                else:
                    st.error("CSVファイルが空です")
            except Exception as e:
                st.error(f"CSVファイルの読み込みに失敗しました: {str(e)}")
    
    with col2:
        st.header("2. 設定を構成")
        
        if 'csv_data' in st.session_state:
            columns = st.session_state['columns']
            
            prefecture = st.text_input("都道府県", value="東京都")
            city = st.text_input("市区町村", value="中央区")
            
            st.subheader("列マッピング")
            st.markdown("CSVの各列をどのフィールドにマッピングするかを選択してください")
            
            column_mapping = {}
            
            number_col = st.selectbox(
                "番号列",
                options=range(1, len(columns) + 1),
                format_func=lambda x: f"{x}: {columns[x-1]}",
                index=1 if len(columns) > 1 else 0,
                help="掲示場番号が含まれる列を選択"
            )
            column_mapping['number'] = number_col
            
            address_col = st.selectbox(
                "住所列",
                options=range(1, len(columns) + 1),
                format_func=lambda x: f"{x}: {columns[x-1]}",
                index=2 if len(columns) > 2 else 0,
                help="住所が含まれる列を選択"
            )
            column_mapping['address'] = address_col
            
            name_col = st.selectbox(
                "名称列",
                options=range(1, len(columns) + 1),
                format_func=lambda x: f"{x}: {columns[x-1]}",
                index=3 if len(columns) > 3 else 0,
                help="掲示場名称が含まれる列を選択"
            )
            column_mapping['name'] = name_col
            
            column_mapping['lat'] = 'lat'
            column_mapping['long'] = 'long'
            
            st.session_state['config'] = {
                'prefecture': prefecture,
                'city': city,
                'column_mapping': column_mapping,
                'api_key': api_key,
                'sleep_ms': sleep_ms,
                'normalize_digits': normalize_digits
            }
    
    if 'csv_data' in st.session_state and 'config' in st.session_state:
        st.header("3. 処理を実行")
        
        config_data = st.session_state['config']
        
        if not config_data['api_key']:
            st.error("⚠️ Google Maps APIキーが環境変数に設定されていません。")
        
        if st.button("🚀 CSV正規化を実行", type="primary", use_container_width=True):
            if not config_data['api_key']:
                st.error("Google Maps APIキーが環境変数GOOGLE_MAPS_API_KEYに設定されていません")
                return
            
            try:
                config = create_config_from_params(
                    config_data['prefecture'],
                    config_data['city'],
                    config_data['column_mapping'],
                    config_data['api_key'],
                    config_data['sleep_ms'],
                    config_data['normalize_digits']
                )
                
                csv_data = st.session_state['csv_data']
                data_rows = csv_data[1:]
                
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                def progress_callback(current, total):
                    progress = current / total
                    progress_bar.progress(progress)
                    status_text.text(f"処理中... {current}/{total} ({progress:.1%})")
                
                with st.spinner("CSV正規化を実行中..."):
                    results = process_csv_data(data_rows, config, progress_callback)
                
                st.success("✅ 正規化が完了しました！")
                
                result_df = pd.DataFrame(results[1:], columns=results[0])
                st.subheader("処理結果")
                st.dataframe(result_df, use_container_width=True)
                
                csv_buffer = io.StringIO()
                csv_writer = csv.writer(csv_buffer)
                csv_writer.writerows(results)
                csv_content = csv_buffer.getvalue()
                
                st.download_button(
                    label="📥 正規化済みCSVをダウンロード",
                    data=csv_content,
                    file_name=f"{config_data['city']}_normalized.csv",
                    mime="text/csv",
                    use_container_width=True
                )
                
                error_count = sum(1 for row in results[1:] if any("ERROR:" in str(cell) for cell in row))
                if error_count > 0:
                    st.warning(f"⚠️ {error_count}件のエラーが発生しました。結果を確認してください。")
                
            except Exception as e:
                st.error(f"処理中にエラーが発生しました: {str(e)}")
    
    with st.expander("📖 使用方法"):
        st.markdown("""
        1. **CSVファイルをアップロード**: ポスター掲示場情報が含まれるCSVファイルを選択
        2. **設定を構成**: 都道府県、市区町村、列マッピングを設定
        3. **処理を実行**: 正規化処理を開始
        4. **結果をダウンロード**: 処理済みCSVファイルをダウンロード
        
        - **認証**: Google Maps APIキーは環境変数から自動的に読み込まれます
        - **CSVフォーマット**: ヘッダー行を含む標準的なCSV形式
        - **列マッピング**: 番号、住所、名称列の指定が必要
        
        - Google Maps APIは課金対象となるため、使用量制限を設定することを推奨します
        - 大量のデータ処理時は、APIコール間隔を調整してください
        - 処理中はブラウザを閉じないでください
        """)

if __name__ == "__main__":
    main()
