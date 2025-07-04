import tempfile
import shutil
import base64
import urllib.parse
import requests
import pandas as pd
from pdf2image import convert_from_path
from typing import List, Dict, Tuple, Optional
import os
from io import StringIO

class PDFProcessor:
    def __init__(self, config_manager):
        self.config = config_manager
        self.client = config_manager.get_openai_client()
    
    def encode_image(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def process_pdf(self, uploaded_file, progress_callback=None, content_callback=None, prompt_text: str = None) -> pd.DataFrame:
        tmp_dir = tempfile.mkdtemp()
        
        try:
            df = pd.DataFrame()
            for key in self.config.csv_columns:
                df[key] = None
            
            pdf_path = os.path.join(tmp_dir, uploaded_file.name)
            base_name = os.path.splitext(uploaded_file.name)[0]
            
            with open(pdf_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            if progress_callback:
                progress_callback("PDFを画像に変換中...", idx=0)

            images = convert_from_path(pdf_path, dpi=300)
            
            not_detected_addresses = []
            
            if progress_callback:
                progress_callback(f"PDFのページ数: {len(images)}", idx=0)

            for i, image in enumerate(images):
                if progress_callback:
                    progress_callback(f"{i+1}ページ目を処理中...", idx=1)
                
                image_path = os.path.join(tmp_dir, f"{base_name}_temp_image_{i+1}.jpg")
                image.save(image_path, "JPEG")
                
                try:
                    new_df = self.extract_addresses_from_image(image_path, prompt_text=prompt_text)
                    if new_df:
                        df = pd.concat([df, pd.DataFrame(new_df)], ignore_index=True)
                    if content_callback:
                        content_callback(image, df.copy())
                except Exception as e:
                    if progress_callback:
                        progress_callback(f"エラー: {str(e)}", idx=1)
                    not_detected_addresses.append({
                        "page": i + 1,
                        "error": str(e)
                    })
                finally:
                    if os.path.exists(image_path):
                        os.remove(image_path)
            if progress_callback:
                progress_callback("全ページ処理しました", idx=1)
            return df
            
        finally:
            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)
    
    def extract_addresses_from_image(self, image_path: str, prompt_text: str = None) -> List[Dict[str, str]]:
        base64_image = self.encode_image(image_path)
        if prompt_text is None:
            prompt_text = "この画像に表があります。投票区の列と番号の列に番号が、そして、各設置場所の説明の列に名称が、所在地に住所が書かれています。リスト化して、「番号」「住所」「名称」をkeyとしたcsv形式で出力してください。必ずcsvだけを出力してください。番号は第N投票区M番だったら、「N-M」のように直して番号へ入れてください。"
        
        completion = self.client.chat.completions.create(
            model=self.config.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text", 
                            "text": prompt_text
                        },
                        {
                            "type": "image_url", 
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ]
        )
        
        texts = completion.choices[0].message.content
        if "```csv" in texts and "```" in texts:
            start = texts.find("```csv") + len("```csv")
            end = texts.rfind("```")
            texts = texts[start:end].strip()
        if "番号" in texts and "住所" in texts and "名称" in texts:
            try:
                df = pd.read_csv(StringIO(texts))
                return df.to_dict(orient="records")
            except Exception:
                pass
