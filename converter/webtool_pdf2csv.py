from dotenv import load_dotenv, find_dotenv
import streamlit as st
from pdf2image import convert_from_path
from openai import OpenAI
import cv2
import numpy as np
from PIL import Image
import requests
import urllib
import pandas as pd
import os, sys, json, base64

load_dotenv(find_dotenv())

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.environ.get('OPENROUTER_API_KEY')
)

GeospatialUrl = "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" #国土地理院APIを使用 

keys = ["場所", "説明", "緯度", "経度"] # CSVのカラム名

model_name = "gpt-4.1-mini"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


uploaded_file = st.file_uploader("PDFをアップロードしてください", type=["pdf"])

if uploaded_file is not None:
    tmp_dir = "tmp_dir"
    os.makedirs(tmp_dir, exist_ok=True) # 一時ディレクトリを作成
    
    placeholder0 = st.empty()
    placeholder1 = st.empty()
    content_placeholder = st.empty()

    df = pd.DataFrame() # データフレームを初期化
    for key in keys:
        df[key] = None
        
    pdf_path = os.path.join(tmp_dir, uploaded_file.name)
    base_name = os.path.splitext(uploaded_file.name)[0]
    
    # PDFを画像に変換
    with placeholder0.container():
        with st.spinner("画像に変換してます..."):
            with open(pdf_path, "wb") as f:
                f.write(uploaded_file.getbuffer()) 
            images = convert_from_path(pdf_path, dpi=300)
    
    placeholder0.text(f"PDFのページ数: {len(images)}")

    # 画像を処理
    with placeholder1.container():
        for i, image in enumerate(images):
            with st.spinner(f"ページ {i+1} を処理しています..."):
                content_placeholder.image(image, caption=f"ページ {i+1}", use_column_width=True)
                image_path = f"{base_name}_temp_image_{i+1}.jpg" # 実装都合で一時ファイルを作成
                image.save(image_path, "JPEG")
                base64_image = encode_image(image_path)
                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                        "role": "user",
                        "content": [{"type": "text", "text": "この画像から住所を重複を許して抽出し、またその説明があれば加えてリスト化し、「住所」と「説明」をkeyとしたjson形式で出力してください。日本語が文字化けしないように気を付けてください。"},  # ここに質問を書く
                                    {"type": "image_url", "image_url":{"url": f"data:image/jpeg;base64,{base64_image}"}},
                            ]
                        }
                    ]
                )
                os.remove(image_path)

                new_row = {key: None for key in keys}
                texts = completion.choices[0].message.content
                
                # JSON形式のテキストを抽出
                # ここでは、テキストの中から最初の'['から最後の']'までを抽出
                start = texts.find('[')
                end = texts.rfind(']')
                if start != -1 and end != -1 and end > start:
                    texts = texts[start:end+1]
                try:
                    pos_dir_list = json.loads(texts)
                except json.JSONDecodeError as e:
                    st.write(f"Warning: Not able to parse page {i+1}: {e}")
                    continue
                
                # 住所を国土地理院に問い合わせる
                for pos_dir in pos_dir_list:
                    address = pos_dir.get("住所", "")
                    if len(address) < 3: # 住所は3文字以上だと仮定
                        continue
                    s_quote = urllib.parse.quote(address)
                    response = requests.get(GeospatialUrl + s_quote)
                    try:
                        lat = response.json()[0]["geometry"]["coordinates"][1]
                        lng = response.json()[0]["geometry"]["coordinates"][0]
                        pos_detected = True
                    except Exception as e:
                        st.write(f"[ERROR] Could not find position for address '{address}': {e}")
                        pos_detected = False
                        lat = None
                        lng = None
                
                    if pos_detected:
                        new_row["場所"] = address
                        new_row["緯度"] = lat
                        new_row["経度"] = lng
                        new_row["説明"] = pos_dir.get("説明", "")
                    else:
                        new_row["場所"] = address
                        new_row["緯度"] = None
                        new_row["経度"] = None
                        new_row["説明"] = pos_dir.get("説明", "") + " (位置情報が見つかりませんでした)"
                    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    os.remove(pdf_path)  
    placeholder1.text("処理が完了しました。")
    content_placeholder.write(df)
    csv_filename = f"{base_name}.csv"
    csv_path = os.path.join(tmp_dir, f"{csv_filename}")
    df.to_csv(csv_path, index=False)  
    st.download_button(
        'ダウンロード',
        open(csv_path, 'rb'),
        f"{csv_filename}"
    )
    uploaded_file.close()
    uploaded_file = None