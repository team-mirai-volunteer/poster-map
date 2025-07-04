import streamlit as st
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from streamlit_image_coordinates import streamlit_image_coordinates
import pandas as pd

st.title("地図画像⇔緯度経度 対応マークツール")

def resize_image(img):
    w, h = img.size
    scale = 1500 / max(w, h)
    new_size = (int(w * scale), int(h * scale))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    return img

uploaded_file = st.file_uploader("地図画像をアップロード", type=["png", "jpg", "jpeg"])

if uploaded_file is not None:
    img = Image.open(uploaded_file)
    img = resize_image(img)
    
    if "coords" not in st.session_state:
        st.session_state["coords"] = []
    if "latlons" not in st.session_state:
        st.session_state["latlons"] = []
    if "clicked_points" not in st.session_state:
        st.session_state["clicked_points"] = []
    if "numbers" not in st.session_state:
        st.session_state["numbers"] = []

    if "homography" not in st.session_state:
        st.write("## 位置合わせ")
        st.write("画像上の2点以上をクリックして、対応する緯度経度を入力してください。")
        
        st.info("""
        💡 **精度向上のコツ**
        
        アフィン変換の精度を最大化するため、以下の点を選択することをお勧めします：
        
        • **地図の対角線上の端点**（左上と右下、または右上と左下）
        • **地図の四隅に近い明確なランドマーク**（建物、交差点、橋など）
        • **できるだけ離れた位置にある2点**
        
        選択する点が離れているほど、座標変換の精度が向上します。
        """)
        
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        img_marked = img.copy()
        draw = ImageDraw.Draw(img_marked)
        for i, (x, y) in enumerate(st.session_state["coords"]):
            r = 5
            draw.ellipse((x - r, y - r, x + r, y + r), outline="red", width=3)
            draw.text((x + r + 2, y - r), str(i + 1), fill="red", font=font)
        
        col1, col2 = st.columns([2, 1])
        with col1:
            st.write("### 画像上をクリックしてマークを追加")
            click = streamlit_image_coordinates(img_marked)
            if click is not None:
                st.session_state["coords"].append((click["x"], click["y"]))
                st.rerun()
        
        with col2:
            if st.button("最後のマークを削除"):
                if st.session_state["coords"]:
                    st.session_state["coords"].pop()
                    if len(st.session_state["latlons"]) > len(st.session_state["coords"]):
                        st.session_state["latlons"].pop()
                st.rerun()
        
        with col2:
            st.write("### 対応する緯度経度を入力（例: 35.6,139.7）")
            for i, _ in enumerate(st.session_state["coords"]):
                latlon = st.text_input(f"マーク{i+1}の緯度,経度", key=f"latlon_{i}")
                if latlon:
                    try:
                        lat, lon = map(float, latlon.split(","))
                        if i >= len(st.session_state["latlons"]):
                            st.session_state["latlons"].append((lat, lon))
                        else:
                            st.session_state["latlons"][i] = (lat, lon)
                    except (ValueError, IndexError):
                        st.warning("入力形式が正しくありません（例: 35.6,139.7）")
        
        if len(st.session_state["coords"]) >= 2 and len(st.session_state["latlons"]) >= 2:
            pts_img = np.array(st.session_state["coords"][:2], dtype=np.float64)
            pts_geo = np.array(st.session_state["latlons"][:2], dtype=np.float64)
            
            def get_2pt_affine(src, dst):
                x0, y0 = src[0]
                x1, y1 = src[1]
                u0, v0 = dst[0]
                u1, v1 = dst[1]
                
                dx, dy = x1 - x0, y1 - y0
                du, dv = u1 - u0, v1 - v0
                
                scale = np.sqrt(du**2 + dv**2) / np.sqrt(dx**2 + dy**2)
                theta = np.arctan2(dv, du) - np.arctan2(dy, dx)
                
                cos_t, sin_t = np.cos(theta), np.sin(theta)
                A = scale * np.array([[cos_t, -sin_t], [sin_t, cos_t]])
                t = np.array([u0, v0]) - A @ np.array([x0, y0])
                M = np.zeros((2, 3), dtype=np.float64)
                M[:2, :2] = A
                M[:2, 2] = t
                return M
            
            M = get_2pt_affine(pts_img, pts_geo)
            
            x0, y0 = pts_img[0]
            x1, y1 = pts_img[1]
            dx, dy = x1 - x0, y1 - y0
            distance = np.sqrt(dx**2 + dy**2)
            
            min_distance_threshold = 100
            
            if distance < min_distance_threshold:
                st.error(f"""
                ⚠️ **マーク間の距離が不十分です**
                
                現在の2点間の距離: {distance:.1f}ピクセル
                推奨距離: {min_distance_threshold}ピクセル以上
                
                **精度向上のため、以下を実行してください：**
                • より離れた位置にマークを配置し直してください
                • 地図の対角線上の端点を選択してください
                • 明確なランドマーク（建物、交差点など）を選んでください
                
                距離が近すぎると座標変換の精度が大幅に低下します。
                """)
                
                with col2:
                    if st.button("マークをやり直す", type="primary"):
                        st.session_state["coords"] = []
                        st.session_state["latlons"] = []
                        st.rerun()
            else:
                st.success(f"✅ マーク間の距離: {distance:.1f}ピクセル（適切な距離です）")
                
                with col2:
                    if st.button("位置合わせ完了"):
                        st.session_state["homography"] = M
                        st.rerun()
    
    else:
        M = st.session_state["homography"]
        
        with st.container():
            col1, col2 = st.columns([2, 1])
            
            with col2:
                st.write("### 番号を入力")
                if st.session_state.get("pending_click") and len(st.session_state["pending_click"]) >= 3:
                    x, y, point_index = st.session_state["pending_click"][:3]
                    st.write(f"座標: ({x}, {y})")
                    
                    if "input_counter" not in st.session_state:
                        st.session_state["input_counter"] = 0
                    
                    input_num = st.text_input("番号", key=f"input_number_{st.session_state['input_counter']}", value="")
                    if st.button("追加", key="add_point"):
                        if input_num.strip() == "":
                            st.warning("番号を入力してください")
                        elif input_num in [num for num in st.session_state["numbers"] if num != ""]:
                            st.warning("番号が重複しています")
                        else:
                            st.session_state["numbers"][point_index] = input_num
                            st.session_state["pending_click"] = None
                            st.session_state["input_counter"] += 1
                            st.rerun()
                    if st.button("キャンセル", key="cancel_point"):
                        st.session_state["clicked_points"].pop(point_index)
                        st.session_state["numbers"].pop(point_index)
                        st.session_state["pending_click"] = None
                        st.rerun()

            rows = []
            for i, (x, y) in enumerate(st.session_state["clicked_points"]):
                if i < len(st.session_state["numbers"]) and st.session_state["numbers"][i] != "":
                    pt = np.array([[x, y, 1]], dtype=np.float64).T
                    geo = M @ pt
                    num = st.session_state["numbers"][i]
                    rows.append({
                        "番号": num,
                        "緯度": f"{geo[0, 0]:.6f}",
                        "経度": f"{geo[1, 0]:.6f}"
                    })
            
            with col2:
                if rows:
                    st.write("### 座標変換結果")
                    df = pd.DataFrame(rows)
                    st.dataframe(df, use_container_width=True)
                    
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="CSVダウンロード",
                        data=csv,
                        file_name="coordinates.csv",
                        mime="text/csv"
                    )
                    
                    st.write("### 指定番号で削除")
                    if "delete_counter" not in st.session_state:
                        st.session_state["delete_counter"] = 0
                    
                    delete_number = st.text_input("削除する番号を入力", key=f"delete_number_{st.session_state['delete_counter']}")
                    if st.button("指定番号を削除", key="delete_by_number"):
                        if delete_number:
                            try:
                                if delete_number in st.session_state["numbers"]:
                                    index_to_delete = st.session_state["numbers"].index(delete_number)
                                    st.session_state["clicked_points"].pop(index_to_delete)
                                    st.session_state["numbers"].pop(index_to_delete)
                                    st.session_state["delete_counter"] += 1
                                    st.success(f"番号 '{delete_number}' を削除しました")
                                    st.rerun()
                                else:
                                    st.warning(f"番号 '{delete_number}' が見つかりません")
                            except (ValueError, IndexError):
                                st.error("削除に失敗しました")
                        else:
                            st.warning("削除する番号を入力してください")
                
                if st.button("リセット"):
                    for key in ["clicked_points", "numbers", "pending_click"]:
                        if key in st.session_state:
                            del st.session_state[key]
                    st.rerun()
            
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            img_final = img.copy()
            draw = ImageDraw.Draw(img_final)
            for i, (x, y) in enumerate(st.session_state["clicked_points"]):
                r = 5
                draw.ellipse((x - r, y - r, x + r, y + r), outline="blue", width=3)
                if i < len(st.session_state["numbers"]):
                    num = st.session_state["numbers"][i]
                    if num != "":
                        draw.text((x + r + 2, y - r), num, fill="blue", font=font)
            
            with col1:
                st.write("### 画像上で場所をクリックしてください（複数可）")
                new_click = streamlit_image_coordinates(img_final, key="final_mark")
                if new_click is not None and (
                    not st.session_state.get("pending_click") or (new_click["x"], new_click["y"]) != tuple(st.session_state["pending_click"][:2])
                ):
                    st.session_state["clicked_points"].append((new_click["x"], new_click["y"]))
                    st.session_state["numbers"].append("")
                    st.session_state["pending_click"] = [new_click["x"], new_click["y"], len(st.session_state["clicked_points"]) - 1]
                    st.rerun()

else:
    st.info("まず地図画像をアップロードしてください。")
