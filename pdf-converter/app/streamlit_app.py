import streamlit as st
import pandas as pd
import tempfile
import os
from config_manager import ConfigManager
from pdf_processor import PDFProcessor

def main():
    st.title("PDF to CSV Converter")
    st.markdown("ポスター掲示場所が書かれたPDFをアップロードして、CSV形式でダウンロードできます。")
    
    config = ConfigManager()
    
    is_valid, message = config.validate_config()
    if not is_valid:
        st.error(f"設定エラー: {message}")
        st.info("OPENROUTER_API_KEYを環境変数に設定してください。")
        return
    
    processor = PDFProcessor(config)
    
    uploaded_file = st.file_uploader("PDFをアップロードしてください", type=["pdf"])
    
    if uploaded_file is not None:
        
        placeholders = [st.empty() for _ in range(3)]
        content_placeholder = st.empty()

        try:
            if 'processed_df' not in st.session_state or st.session_state.get('last_uploaded_file') != uploaded_file.name:
                with st.spinner("処理中..."):
                    
                    placeholders = [st.empty() for _ in range(3)]
                    content_placeholder = st.empty()

                    def progress_callback_message(message, idx=0):
                        placeholders[idx].text(message)
                        
                    def viewer_callback_content(image):
                        content_placeholder.image(image, use_container_width=True)
                        
                    df = processor.process_pdf(uploaded_file, progress_callback_message, viewer_callback_content)
                st.session_state['processed_df'] = df
                st.session_state['last_uploaded_file'] = uploaded_file.name
            else:
                df = st.session_state['processed_df']

            placeholders[2].text("処理が完了しました。しばらくすると下の方にダウンロードボタンが表示されます。")
            content_placeholder.write(df)

            if not df.empty:
                base_name = os.path.splitext(uploaded_file.name)[0]
                csv_filename = f"{base_name}.csv"

                csv_data = df.to_csv(index=False).encode('utf-8')

                st.download_button(
                    label='CSVをダウンロード',
                    data=csv_data,
                    file_name=csv_filename,
                    mime='text/csv'
                )
            else:
                st.warning("処理できるデータが見つかりませんでした。")

        except Exception as e:
            st.error(f"処理中にエラーが発生しました: {str(e)}")
            st.info("PDFファイルが正しい形式であることを確認してください。")

if __name__ == "__main__":
    main()
