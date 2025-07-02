import streamlit as st
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from streamlit_image_coordinates import streamlit_image_coordinates

st.title("地図画像⇔緯度経度 対応マークツール")

# 画像アップロード
target_img = st.file_uploader("地図画像をアップロード", type=["png", "jpg", "jpeg"])

if target_img:
    img = Image.open(target_img).convert("RGBA")
    # 長辺1500ピクセルにリサイズ
    w, h = img.size
    scale = 1500 / max(w, h)
    new_size = (int(w * scale), int(h * scale))
    img = img.resize(new_size, Image.LANCZOS)

    # 位置合わせ後の新規マーク入力モードを最初に分岐
    if "homography" in st.session_state:
        M = np.array(st.session_state["homography"])
        if "clicked_points" not in st.session_state:
            st.session_state["clicked_points"] = []
        if "numbers" not in st.session_state:
            st.session_state["numbers"] = []
        img_final = img.copy()
        draw_final = ImageDraw.Draw(img_final)
        font = None
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", 24)
        except:
            font = None
        # すべてのクリック履歴を描画
        for i, (x, y) in enumerate(st.session_state["clicked_points"]):
            r = 7
            draw_final.ellipse((x - r, y - r, x + r, y + r), outline="blue", width=1)
            # 番号リストがあればそれを表示、なければi+1
            num = st.session_state["numbers"][i] if i < len(st.session_state["numbers"]) else str(i+1)
            draw_final.text((x + r + 2, y - r), str(num), fill="blue")
        col1, col2 = st.columns([2, 1])
        with col1:
            st.write("### 画像上で場所をクリックしてください（複数可）")
            # 新規クリック受付
            new_click = streamlit_image_coordinates(img_final, key="final_mark")
            if new_click is not None and (
                not st.session_state.get("pending_click") or (new_click["x"], new_click["y"]) != tuple(st.session_state["pending_click"][:2])
            ):
                # 新規クリック時はpending_clickに座標を保存し、番号入力待ち
                st.session_state["pending_click"] = [new_click["x"], new_click["y"], ""]
                st.rerun()
            # 再描画時に全履歴を反映
            draw_final = ImageDraw.Draw(img_final)
            for i, (x, y) in enumerate(st.session_state["clicked_points"]):
                r = 7
                num = st.session_state["numbers"][i] if i < len(st.session_state["numbers"]) else str(i+1)
                draw_final.ellipse((x - r, y - r, x + r, y + r), outline="blue", width=3)
                draw_final.text((x + r + 2, y - r), str(num), fill="blue", font=font)
            st.image(img_final, caption="画像上でクリックした場所にマークが表示されます", use_container_width=True)
        with col2:
            # 番号入力待ち状態のときのみ右側に番号入力欄を表示
            if "pending_click" in st.session_state and st.session_state["pending_click"]:
                x, y, pending_num = st.session_state["pending_click"]
                st.info(f"座標({int(x)}, {int(y)})で番号を入力してください")
                input_num = st.text_input("追加する番号", value=pending_num, key="pending_num")
                if st.button("追加", key="add_point"):
                    if input_num in st.session_state["numbers"]:
                        st.warning("番号が重複しています")
                    elif input_num.strip() == "":
                        st.warning("番号を入力してください")
                    else:
                        st.session_state["clicked_points"].append((x, y))
                        st.session_state["numbers"].append(input_num)
                        st.session_state["pending_click"] = []
                        st.rerun()
            st.write("#### クリックした場所の緯度経度リスト（番号編集・削除可）")
            import pandas as pd
            # prefecture, cityはsession_stateから取得
            prefecture = st.session_state.get("prefecture", "")
            city = st.session_state.get("city", "")
            # DataFrameで番号・緯度・経度のみ表示
            rows = []
            for i, (x, y) in enumerate(st.session_state["clicked_points"]):
                pt = np.array([[x, y, 1]], dtype=np.float32).T
                geo = M @ pt
                num = st.session_state["numbers"][i] if i < len(st.session_state["numbers"]) else str(i+1)
                rows.append({
                    "prefecture": prefecture,
                    "city": city,
                    "number": num,
                    "address": "未記載",
                    "name": "",
                    "lat": f"{geo[0][0]:.6f}",
                    "long": f"{geo[1][0]:.6f}"
                })
            columns = ["prefecture", "city", "number", "address", "name", "lat", "long"]
            display_columns = ["number", "lat", "long"]
            if rows:
                df = pd.DataFrame(rows, columns=columns)
                st.dataframe(df[display_columns], hide_index=True)
                # CSVダウンロードボタン（カラム順も指定）
                csv = df.to_csv(index=False, columns=columns, sep=",", encoding="utf-8-sig")
                st.download_button("CSVダウンロード", data=csv, file_name="map_points.csv", mime="text/csv")
            else:
                st.info("画像上をクリックしてください")

            # 番号による削除
            del_num = st.text_input("削除したい番号を入力", key="del_num")
            if del_num:
                if del_num in st.session_state["numbers"]:
                    idx = st.session_state["numbers"].index(del_num)
                    st.session_state["clicked_points"].pop(idx)
                    st.session_state["numbers"].pop(idx)
                    st.rerun()
                elif del_num != "":
                    st.warning("該当する番号がありません")

            # 番号による変更
            edit_num = st.text_input("変更したい番号を入力", key="edit_num")
            new_num = None
            if edit_num:
                if edit_num in st.session_state["numbers"]:
                    idx = st.session_state["numbers"].index(edit_num)
                    # 新しい番号の入力欄とボタンをcol2内に配置
                    new_num = st.text_input(f"新しい番号（現在: {edit_num}）", key=f"newnum_{edit_num}")
                    if st.button("番号を変更", key=f"apply_{edit_num}"):
                        if new_num in st.session_state["numbers"] and new_num != edit_num:
                            st.warning("番号が重複しています")
                        else:
                            st.session_state["numbers"][idx] = new_num
                            st.rerun()
                elif edit_num != "":
                    st.warning("該当する番号がありません")

        # 画像上のマークの番号も表の番号と一致させて描画
        draw_final = ImageDraw.Draw(img_final)
        for i, (x, y) in enumerate(st.session_state["clicked_points"]):
            r = 7
            num = st.session_state["numbers"][i] if i < len(st.session_state["numbers"]) else str(i+1)
            draw_final.ellipse((x - r, y - r, x + r, y + r), outline="blue", width=3)
            draw_final.text((x + r + 2, y - r), str(num), fill="blue", font=font)
        st.image(img_final, caption="画像上でクリックした場所にマークが表示されます", use_container_width=True)
        st.stop()
    else:
        pass

    # ここから下は「位置合わせ前」のみ
    if "coords" not in st.session_state:
        st.session_state["coords"] = []
    if "latlons" not in st.session_state:
        st.session_state["latlons"] = []

    # 都道府県・市区町村入力欄（ここで入力）
    prefecture = st.text_input("都道府県 (prefecture)", value=st.session_state.get("prefecture", ""))
    city = st.text_input("市区町村 (city)", value=st.session_state.get("city", ""))
    st.session_state["prefecture"] = prefecture
    st.session_state["city"] = city

    # 2カラムレイアウト
    col1, col2 = st.columns([2, 1])
    with col1:
        next_idx = len(st.session_state["coords"]) + 1
        st.write(f"### 画像上で対応点をクリックしてください。2つの点はできるだけ離れた位置にしてください")
        # 2点以上で2Dアフィン変換を計算する前のみ案内文を表示
        if len(st.session_state["coords"]) < 2 or len(st.session_state["latlons"]) < 2:
            st.info(f"{next_idx}番目の点をクリックしてください")
        # 印付き画像を作成
        img_marked = img.copy()
        draw = ImageDraw.Draw(img_marked)
        font = None
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", 24)
        except:
            font = None
        for i, (x, y) in enumerate(st.session_state["coords"]):
            r = 5
            draw.ellipse((x - r, y - r, x + r, y + r), outline="red", width=3)
            draw.text((x + r + 2, y - r), str(i + 1), fill="red", font=font)
        click = streamlit_image_coordinates(img_marked)
        if click is not None:
            st.session_state["coords"].append((click["x"], click["y"]))
            st.rerun()  # クリック直後に即再描画
        # やり直しボタン
        if st.button("最後の点を取り消す", key="undo") and st.session_state["coords"]:
            st.session_state["coords"].pop()
            if st.session_state["latlons"]:
                st.session_state["latlons"].pop()
            st.rerun()
    with col2:
        st.write("### 対応する緯度経度を入力（例: 35.6,139.7）")
        for i, (x, y) in enumerate(st.session_state["coords"]):
            latlon = st.text_input(f"マーク{i+1}の緯度,経度", key=f"latlon_{i}")
            if latlon:
                try:
                    lat, lon = map(float, latlon.split(","))
                    if len(st.session_state["latlons"]) <= i:
                        st.session_state["latlons"].append((lat, lon))
                    else:
                        st.session_state["latlons"][i] = (lat, lon)
                except Exception:
                    st.warning(f"入力形式が正しくありません（例: 35.6,139.7）")
        # 2点以上で2Dアフィン変換を計算
        if len(st.session_state["coords"]) >= 2 and len(st.session_state["latlons"]) >= 2:
            pts_img = np.array(st.session_state["coords"][:2], dtype=np.float32)
            pts_geo = np.array(st.session_state["latlons"][:2], dtype=np.float32)
            def get_2pt_affine(src, dst):
                # src, dst: shape=(2,2)
                x0, y0 = src[0]
                x1, y1 = src[1]
                u0, v0 = dst[0]
                u1, v1 = dst[1]
                dx, dy = x1 - x0, y1 - y0
                du, dv = u1 - u0, v1 - v0
                if dx == 0 and dy == 0:
                    raise ValueError("2点が同じです")
                scale = np.hypot(du, dv) / np.hypot(dx, dy)
                theta = np.arctan2(dv, du) - np.arctan2(dy, dx)
                cos_t, sin_t = np.cos(theta), np.sin(theta)
                A = scale * np.array([[cos_t, -sin_t], [sin_t, cos_t]])
                t = np.array([u0, v0]) - A @ np.array([x0, y0])
                M = np.zeros((2, 3), dtype=np.float32)
                M[:2, :2] = A
                M[:2, 2] = t
                return M
            M = get_2pt_affine(pts_img, pts_geo)
            st.success("2点の対応から2Dアフィン変換を計算しました。")
            st.info("対応関係が分かりました。ボタンを押してポスター設置位置を定めましょう")
            if st.button("位置合わせ後、画像上で新たな場所をクリックするモードにリセット", key="reset_after_affine"):
                st.session_state["homography"] = M.tolist()
                st.session_state["coords"] = []
                st.session_state["latlons"] = []
                st.session_state["new_mark"] = None
                st.session_state["clicked_points"] = []
                st.session_state["remarks"] = []
                st.rerun()
            st.stop()
else:
    st.info("まず地図画像をアップロードしてください。")
