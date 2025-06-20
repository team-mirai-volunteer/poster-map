import tempfile
import shutil
import base64
import json
import urllib.parse
import requests
import pandas as pd
from pdf2image import convert_from_path
from typing import List, Dict, Any, Tuple, Optional
import os

class PDFProcessor:
    def __init__(self, config_manager):
        self.config = config_manager
        self.client = config_manager.get_openai_client()
    
    def encode_image(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def process_pdf(self, uploaded_file, progress_callback=None, content_callback=None) -> pd.DataFrame:
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
                
                if content_callback:
                    content_callback(image)

                image_path = os.path.join(tmp_dir, f"{base_name}_temp_image_{i+1}.jpg")
                image.save(image_path, "JPEG")
                
                try:
                    addresses = self.extract_addresses_from_image(image_path)
                    
                    for address_data in addresses:
                        address = address_data.get("住所", "")
                        if len(address) < 3:
                            continue
                        
                        lat, lng, pos_detected = self.geocode_address(address)
                        
                        new_row = {}
                        new_row["場所"] = address
                        new_row["緯度"] = lat
                        new_row["経度"] = lng
                        
                        description = address_data.get("説明", "")
                        if not pos_detected:
                            description += " (位置情報が見つかりませんでした)"
                            not_detected_addresses.append(address)
                            for addr in not_detected_addresses:
                                progress_callback(f"{addr} の位置情報が見つかりませんでした。", idx=2)
                        new_row["説明"] = description
                        
                        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
                
                finally:
                    if os.path.exists(image_path):
                        os.remove(image_path)
            if progress_callback:
                progress_callback(f"全ページ処理しました", idx=1)
            return df
            
        finally:
            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)
    
    def extract_addresses_from_image(self, image_path: str) -> List[Dict[str, str]]:
        base64_image = self.encode_image(image_path)
        
        completion = self.client.chat.completions.create(
            model=self.config.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text", 
                            "text": "この画像から住所を重複を許して抽出し、またその説明があれば加えてリスト化し、「住所」と「説明」をkeyとしたjson形式で出力してください。日本語が文字化けしないように気を付けてください。"
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
        
        start = texts.find('[')
        end = texts.rfind(']')
        if start != -1 and end != -1 and end > start:
            texts = texts[start:end+1]
        
        try:
            return json.loads(texts)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse OCR response: {e}")
    
    def geocode_address(self, address: str) -> Tuple[Optional[float], Optional[float], bool]:
        s_quote = urllib.parse.quote(address)
        response = requests.get(self.config.geospatial_url + s_quote)
        
        try:
            geo_data = response.json()
            if geo_data and len(geo_data) > 0:
                coordinates = geo_data[0]["geometry"]["coordinates"]
                lat = coordinates[1]
                lng = coordinates[0]
                return lat, lng, True
            else:
                return None, None, False
        except Exception:
            return None, None, False
