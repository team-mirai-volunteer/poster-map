import re
import unicodedata
import requests
import time
from math import radians, cos, sin, sqrt, atan2
import os
import pandas as pd

# .envから環境変数をロード（/app/.env優先）
try:
    from dotenv import load_dotenv
    load_dotenv('/app/.env')
    load_dotenv()
except ImportError:
    pass

KANJI_NUMERAL_MAP = {
    "〇": 0, "一": 1, "二": 2, "三": 3, "四": 4,
    "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
    "十": 10
}

def kanji_to_number(kanji):
    if kanji == "十":
        return 10
    if "十" in kanji:
        parts = kanji.split("十")
        left = KANJI_NUMERAL_MAP.get(parts[0], 1) if parts[0] else 1
        right = KANJI_NUMERAL_MAP.get(parts[1], 0) if len(parts) > 1 and parts[1] else 0
        return left * 10 + right
    num = 0
    for ch in kanji:
        num = num * 10 + KANJI_NUMERAL_MAP.get(ch, 0)
    return num

def normalize_address_digits(addr):
    addr = unicodedata.normalize("NFKC", addr)
    addr = re.sub(r"[‐－―ー−]", "-", addr)
    def replacer(match):
        kanji = match.group(1)
        unit = match.group(2)
        return f"{kanji_to_number(kanji)}{unit}"
    return re.sub(r"([〇一二三四五六七八九十]+)(丁目|番|号)", replacer, addr).strip().strip("　")

def clean(val):
    if isinstance(val, str):
        return val.strip().strip("　")
    else:
        return str(val) if val is not None else ""

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def get_gmap_latlng(address, api_key):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": api_key, "language": "ja"}
    try:
        res = requests.get(url, params=params, timeout=10)
        data = res.json()
        status = data.get("status")
        if status == "OK":
            loc = data["results"][0]["geometry"]["location"]
            return loc["lat"], loc["lng"]
        elif status == "ZERO_RESULTS":
            return None, None
        elif status == "OVER_QUERY_LIMIT":
            raise Exception("Google Maps APIのクォータを超過しました")
        elif status == "REQUEST_DENIED":
            raise Exception("Google Maps APIリクエストが拒否されました。APIキーを確認してください")
        else:
            raise Exception(f"Google Maps APIエラー: {status}")
    except requests.exceptions.Timeout:
        raise Exception("Google Maps APIのタイムアウト")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Google Maps API通信エラー: {str(e)}")
    except Exception:
        raise

def get_gsi_latlng(address):
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch"
    params = {"q": address}
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        result = res.json()
        if result and len(result) > 0 and isinstance(result[0], dict) and "geometry" in result[0]:
            if "coordinates" not in result[0]["geometry"]:
                return None, None
            lon, lat = result[0]["geometry"]["coordinates"]
            if not (20 <= lat <= 46 and 122 <= lon <= 154):
                return None, None
            return lat, lon
        return None, None
    except requests.exceptions.Timeout:
        return None, None
    except Exception:
        return None, None

def get_jageocoder_latlng(address, area=None):
    url = "http://jageocoder.tsuruharu.com/geocode"
    params = {"addr": address}
    if area:
        params["area"] = area
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        result = res.json()
        # レスポンスはリスト形式で返ってくる
        if result and isinstance(result, list) and len(result) > 0:
            first_result = result[0]
            if isinstance(first_result, dict) and "node" in first_result:
                node = first_result["node"]
                # x, yフィールドを使用（lon, lat）
                if "x" in node and "y" in node:
                    lon = node["x"]  # x = longitude
                    lat = node["y"]  # y = latitude
                    if not (20 <= lat <= 46 and 122 <= lon <= 154):
                        return None, None
                    return lat, lon
        return None, None
    except requests.exceptions.Timeout:
        return None, None
    except Exception:
        return None, None

def reverse_geocode_google(lat, lng, api_key):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"latlng": f"{lat},{lng}", "key": api_key, "language": "ja"}
    try:
        res = requests.get(url, params=params)
        data = res.json()
        if data.get("status") == "OK":
            return data["results"][0]["formatted_address"]
        else:
            return None
    except Exception:
        return None

def reverse_geocode_jageocoder(lat, lng, level=7):
    """
    Jageocoder APIの逆ジオコーディング
    
    Args:
        lat (float): 緯度
        lng (float): 経度
        level (int): 住所レベル (1-8, デフォルト7=番地レベル)
        
    Returns:
        str or None: 住所文字列、取得失敗時はNone
    """
    url = "http://jageocoder.tsuruharu.com/rgeocode"
    params = {
        "lat": lat,
        "lon": lng,
        "level": level
    }
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        result = res.json()
        
        # レスポンスはリスト形式で返ってくる
        if result and isinstance(result, list) and len(result) > 0:
            first_result = result[0]
            if isinstance(first_result, dict) and "candidate" in first_result:
                candidate = first_result["candidate"]
                if "fullname" in candidate and isinstance(candidate["fullname"], list):
                    # fullnameの配列を連結して住所文字列を作成
                    address_parts = candidate["fullname"]
                    return "".join(address_parts)
        return None
    except requests.exceptions.Timeout:
        return None
    except Exception:
        return None

def normalize_japanese_address(addr):
    if not addr:
        return ""
    addr = unicodedata.normalize("NFKC", addr)
    addr = re.sub(r'日本|JAPAN', '', addr, flags=re.IGNORECASE)
    addr = re.sub(r'〒\d{3}-?\d{4}', '', addr)
    addr = re.sub(r'^[\s、,．.]+', '', addr)
    addr = re.sub(r'\s+', '', addr)
    addr = re.sub(r'[‐－―ー−]', '-', addr)
    addr = addr.replace('番地', '番')
    addr = normalize_address_digits(addr)
    addr = re.sub(r'(先|付近|階|Ｆ|号室|室|[A-Za-zａ-ｚＡ-Ｚ]{1,10})$', '', addr)

    # 丁目+番パターン
    m = re.search(r'^(.+?)(\d+)丁目(\d+)番', addr)
    if m:
        town = m.group(1)
        chome = m.group(2)
        ban = m.group(3)
        return f'{town}{chome}丁目{ban}番'

    # 丁目+ハイフン+番地
    m = re.search(r'^(.+?)(\d+)丁目(\d+)-', addr)
    if m:
        town = m.group(1)
        chome = m.group(2)
        ban = m.group(3)
        return f'{town}{chome}丁目{ban}番'

    # 町名+ハイフン+数字（丁目なし）
    m = re.search(r'^(.+?)(\d+)-', addr)
    if m:
        town = m.group(1)
        ban = m.group(2)
        return f'{town}{ban}番'

    # 丁目だけ
    m = re.search(r'^(.+?)(\d+)丁目', addr)
    if m:
        town = m.group(1)
        chome = m.group(2)
        return f'{town}{chome}丁目'

    # 番だけ
    m = re.search(r'^(.+?)(\d+)番', addr)
    if m:
        town = m.group(1)
        ban = m.group(2)
        return f'{town}{ban}番'

    m = re.match(r'^([^\d]+)', addr)
    if m:
        return m.group(1)
    return addr

def remove_prefecture_duplication(prefecture, address):
    """
    Remove prefecture name from address if it appears at the beginning
    """
    if not prefecture or not address:
        return address
    
    if address.startswith(prefecture):
        return address[len(prefecture):].strip()
    return address

def remove_city_duplication(city, address):
    """
    Remove city name from address if it appears at the beginning
    """
    if not city or not address:
        return address
    
    if address.startswith(city):
        return address[len(city):].strip()
    return address

def clean_address_duplicates(prefecture, city, address):
    """
    Remove prefecture and city duplications from address
    Returns cleaned address that should only contain city+ portion
    """
    if not address:
        return address
    
    cleaned = remove_prefecture_duplication(prefecture, address)
    
    cleaned = remove_city_duplication(city, cleaned)
    
    return cleaned

def addresses_roughly_match(addr1, addr2, threshold=None):
    core1 = normalize_japanese_address(addr1)
    core2 = normalize_japanese_address(addr2)
    return core1 == core2

def get_best_latlng(index, address, api_key, gsi_check=True, distance_threshold=200, priority="gsi", 
                    mode="distance", reverse_geocode_check=False, note_out=None, logger=None,
                    jageocoder_check=False, area=None):
    # 各モードに応じてAPIを呼び出す
    if priority == "gsi" and mode in ["gsi_only"]:
        # 国土地理院のみモード
        lat1, lon1 = None, None
        lat2, lon2 = get_gsi_latlng(address)
        lat3, lon3 = None, None
    elif priority == "jageocoder" and mode in ["jageocoder_only"]:
        # Jageocoderのみモード
        lat1, lon1 = None, None
        lat2, lon2 = None, None
        lat3, lon3 = get_jageocoder_latlng(address, area)
    else:
        # 通常モード（複数API使用）
        lat1, lon1 = get_gmap_latlng(address, api_key) if api_key else (None, None)
        lat2, lon2 = get_gsi_latlng(address) if gsi_check else (None, None)
        lat3, lon3 = get_jageocoder_latlng(address, area) if jageocoder_check else (None, None)

    if lat1 is None and lat2 is None and lat3 is None:
        if logger: logger(f"警告: '{address}' の座標取得に失敗しました。")
        if note_out is not None:
            note_out.append("緯度経度は怪しい")
        return None, None, "none"

    # 逆ジオコーディングモード
    if mode == "reverse_geocode" and reverse_geocode_check and lat1 is not None:
        rev_addr = reverse_geocode_google(lat1, lon1, api_key)
        suspicious = False
        if rev_addr is not None:
            if not addresses_roughly_match(address, rev_addr):
                if logger:
                    logger(f"警告: {index}行目 '{address}' Google座標の逆引きが不一致'{rev_addr}' → 国土地理院APIを採用します。")
                suspicious = True
        else:
            suspicious = True  # 逆ジオコーディング失敗も怪しいとみなす
        if suspicious:
            if note_out is not None:
                note_out.append("緯度経度は怪しい")
            if lat2 is not None:
                return lat2, lon2, "gsi"
            else:
                return None, None, "none"
        else:
            return lat1, lon1, "google"

    # 距離チェックモード（従来方式）
    if mode == "distance":
        # 使用可能な座標を集める
        coords = []
        if lat1 is not None:
            coords.append(("google", lat1, lon1))
        if lat2 is not None:
            coords.append(("gsi", lat2, lon2))
        if lat3 is not None:
            coords.append(("jageocoder", lat3, lon3))
        
        # 1つしか取得できなかった場合
        if len(coords) == 1:
            return coords[0][1], coords[0][2], coords[0][0]
        
        # 複数取得できた場合、距離を比較
        if len(coords) >= 2:
            distances = {}
            for i in range(len(coords)):
                for j in range(i + 1, len(coords)):
                    name1, lat_i, lon_i = coords[i]
                    name2, lat_j, lon_j = coords[j]
                    dist = haversine(lat_i, lon_i, lat_j, lon_j)
                    distances[f"{name1}-{name2}"] = dist
            
            # 最大距離が閾値を超える場合
            max_dist = max(distances.values())
            if max_dist >= distance_threshold:
                # 優先順位に基づいて選択するAPIを決定
                selected_api = None
                if priority == "gsi" and lat2 is not None:
                    selected_api = "gsi"
                    selected_lat, selected_lon = lat2, lon2
                elif priority == "jageocoder" and lat3 is not None:
                    selected_api = "jageocoder"
                    selected_lat, selected_lon = lat3, lon3
                else:
                    selected_api = "google"
                    selected_lat, selected_lon = lat1, lon1
                
                if logger:
                    # 閾値を超えるAPI間のズレをすべて報告
                    over_threshold_pairs = []
                    for pair, dist in distances.items():
                        if dist >= distance_threshold:
                            # API名を読みやすく変換
                            api1, api2 = pair.split('-')
                            api1_name = {"google": "Google", "gsi": "国土地理院", "jageocoder": "Jageocoder"}.get(api1, api1)
                            api2_name = {"google": "Google", "gsi": "国土地理院", "jageocoder": "Jageocoder"}.get(api2, api2)
                            over_threshold_pairs.append(f"{int(dist)}m（{api1_name}-{api2_name}間）")
                    
                    # 採用するAPIの名前を変換
                    selected_api_name = {"google": "Google", "gsi": "国土地理院", "jageocoder": "Jageocoder"}.get(selected_api, selected_api)
                    
                    if over_threshold_pairs:
                        logger(f"警告: {index}行目 '{address}' の座標間に閾値を超えるズレがあります: " + ", ".join(over_threshold_pairs) + f"。{selected_api_name}座標を採用します。")
                
                if note_out is not None:
                    note_out.append("緯度経度は怪しい")
                
                return selected_lat, selected_lon, selected_api
            
            # すべてが閾値以内の場合、優先順位に基づいて選択
            if priority == "gsi" and lat2 is not None:
                return lat2, lon2, "gsi"
            elif priority == "jageocoder" and lat3 is not None:
                return lat3, lon3, "jageocoder"
            else:
                return lat1, lon1, "google"

    if lat1 is not None:
        return lat1, lon1, "google"
    if lat2 is not None:
        return lat2, lon2, "gsi"
    if lat3 is not None:
        return lat3, lon3, "jageocoder"
    if note_out is not None:
        note_out.append("緯度経度は怪しい")
    return None, None, "none"

def render_template(index, template_str, row, cache, full_api_address, api_key, sleep_msec, 
                    gsi_check, gsi_dist, priority, mode, reverse_geocode_check, logger=None):
    def replacer(match):
        token = match.group(1)
        if token.isdigit():
            idx = int(token) - 1
            return str(clean(row[idx])) if idx < len(row) else ""
        elif token in ("lat", "long"):
            if "latlng" not in cache:
                # lat, lng をキャッシュ
                # note_outはここでは使わない（get_best_latlngはprocess_csv_dataで実行）
                pass
            lat, lng = cache.get("latlng", (None, None))
            return str(clean(lat if token == "lat" else lng))
        else:
            return ""
    return re.sub(r"\{([^{}]+)\}", replacer, template_str)

def process_csv_data(
    csv_data, config, progress_callback=None, log_callback=None,
    gsi_check=True, gsi_distance=200, priority="gsi", mode="distance", reverse_geocode_check=False,
    jageocoder_check=False
):
    format_config = config["format"]
    header = list(format_config.keys())
    if "note" not in header:
        header.append("note")

    api_needed = any("{lat}" in v or "{long}" in v for v in format_config.values())
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY") if api_needed else None
    sleep_msec = int(config.get("api", {}).get("sleep", 200)) if api_needed else 200

    results = [header]

    for idx, row in enumerate(csv_data, start=1):
        if progress_callback:
            progress_callback(idx, len(csv_data))

        out_row = []
        cache = {}
        note_list = []

        address_token = format_config.get("address", "")
        if "{" in address_token and "}" in address_token:
            match = re.search(r"\{(\d+)\}", address_token)
            address_index = int(match.group(1)) - 1 if match else -1
            raw_address = row[address_index] if 0 <= address_index < len(row) else ""
        else:
            raw_address = ""

        if config.get("normalize_address_digits", False):
            normalized_address = normalize_address_digits(raw_address)
        else:
            normalized_address = raw_address.strip().strip("　")

        cleaned_address = clean_address_duplicates(
            format_config['prefecture'], 
            format_config['city'], 
            normalized_address
        )

        full_api_address = f"{format_config['prefecture']}{format_config['city']}{cleaned_address}"

        # 緯度経度（note_listを渡してget_best_latlng内でnote列をセット）
        # Jageocoderのareaパラメータ用に都道府県を取得
        area = format_config.get('prefecture', '')
        lat, lng, source = get_best_latlng(
            idx, full_api_address, api_key, gsi_check, gsi_distance, priority, mode, reverse_geocode_check, note_list, log_callback,
            jageocoder_check, area
        )
        cache["latlng"] = (lat, lng)
        cache["source"] = source
        time.sleep(sleep_msec / 1000)

        for col_name in header:
            if col_name == "note":
                out_row.append("".join(str(item) for item in note_list))
            elif col_name == "address":
                out_row.append(clean(cleaned_address))
            elif col_name in format_config:
                rendered = render_template(
                    idx, format_config[col_name], row, cache, full_api_address, api_key, sleep_msec, 
                    gsi_check, gsi_distance, priority, mode, reverse_geocode_check, log_callback
                )
                out_row.append(rendered)
            else:
                out_row.append("")

        results.append(out_row)

    if log_callback:
        log_callback("完了")

    return results

def get_prefecture_from_partial_address(partial_address: str, use_gsi: bool = True) -> str:
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch"
    params = {
        "q": partial_address
    }

    if not use_gsi:
        return "都道府県の自動判定は無効です（Googleのみモード）"
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        results = response.json()
        if not results:
            return "都道府県が特定できませんでした"

        # フル住所を取得（例: "東京都板橋区高島平三丁目"）
        full_address = results[0]["properties"]["title"]

        # 最初の都道府県名（通常は2〜3文字）を切り出し
        for pref in [
            "北海道", "東京都", "大阪府", "京都府",
            "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
            "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "神奈川県",
            "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
            "岐阜県", "静岡県", "愛知県", "三重県",
            "滋賀県", "兵庫県", "奈良県", "和歌山県",
            "鳥取県", "島根県", "岡山県", "広島県", "山口県",
            "徳島県", "香川県", "愛媛県", "高知県",
            "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
        ]:
            if full_address.startswith(pref):
                return pref

        return "都道府県の抽出に失敗しました"

    except Exception as e:
        return f"エラーが発生しました:{str(e)} → 住所:{partial_address}"

def extract_address_like_text_from_last_row(df: pd.DataFrame) -> str:
    try:
        # 最後の行を取得
        last_row = df.iloc[-1]

        # 住所らしき文字列の判定（4文字以上の日本語＋全角数字）
        address_pattern = re.compile(r'[ぁ-んァ-ン一-龥〇一二三四五六七八九十０-９]{4,}')

        for col in df.columns:
            cell = str(last_row[col])
            if address_pattern.search(cell):
                return cell  # 最初に見つかった候補を返す

        return ""  # 見つからなかった場合

    except Exception:
        return ""  # エラー時にも空文字列を返す
