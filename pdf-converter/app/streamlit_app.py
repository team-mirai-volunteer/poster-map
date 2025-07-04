import streamlit as st
import pandas as pd
import tempfile
import os
from config_manager import ConfigManager
from pdf_processor import PDFProcessor

def main():
    st.title("PDF to CSV Converter")
    st.markdown("ポスター掲示場所が書かれたPDFをアップロードして、CSV形式でダウンロードできます。")
    
    # プロンプト入力欄を指定の文言に変更
    default_prompt = "この画像に表があります。投票区の列と番号の列に番号が、そして、各設置場所の説明の列に名称が、所在地に住所が書かれています。リスト化して、「番号」「住所」「名称」をkeyとしたcsv形式で出力してください。必ずcsvだけを出力してください。番号は第N投票区M番だったら、「N-M」のように直して番号へ入れてください。"
    st.markdown("""
**プロンプト例**
- 例1：この画像には地図がありますが、それは無視してください。地図の上に投票区名と、番号から始まる名称と、かっこで囲まれてた住所が書いてあります。リスト化して、「番号」「住所」「名称」をkeyとしたcsv形式で出力してください。必ずcsvだけを出力してください。第N投票区で3番目なら「N-3」のようにして「番号」へ入れてください。住所の中のスペースは削除してください。
- 例2：この画像の左側に表が書かれています。掲示番号の列にN～Mのように番号が、各マスには名称が、その右に住所が書いてあります。これらをリスト化して、「番号」「住所」「名称」をkeyとしたcsv形式で出力してください。必ずcsvだけを出力してください。番号は「N-M」のようにして「番号」へ入れてください。番号は必ず英数小文字にしてください。
""")
    prompt_text = st.text_area("AIへの指示文（プロンプト）を入力してください", value=default_prompt, height=100)
    
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
        # 画像とdfを横並びで表示するためのプレースホルダ
        image_table_placeholder = st.empty()

        try:
            if 'processed_df' not in st.session_state or st.session_state.get('last_uploaded_file') != uploaded_file.name:
                with st.spinner("処理中..."):

                    def progress_callback_message(message, idx=0):
                        placeholders[idx].text(message)
                        
                    def viewer_callback_content(image, df):
                        with image_table_placeholder.container():
                            cols = st.columns(2)
                            cols[0].image(image, use_container_width=True, caption="ページ画像")
                            cols[1].dataframe(df, use_container_width=True)
                        
                    df = processor.process_pdf(uploaded_file, progress_callback_message, viewer_callback_content, prompt_text=prompt_text)
                st.session_state['processed_df'] = df
                st.session_state['last_uploaded_file'] = uploaded_file.name
                # 画像・途中dfの表示を消す
                image_table_placeholder.empty()
                content_placeholder.empty()
            else:
                df = st.session_state['processed_df']

            placeholders[2].text("処理が完了しました。しばらくすると下の方にダウンロードボタンが表示されます。")
            # 最終dfのみ表示
            st.dataframe(df, use_container_width=True)

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
