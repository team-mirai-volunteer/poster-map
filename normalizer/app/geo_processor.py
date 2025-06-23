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

def addresses_roughly_match(addr1, addr2, threshold=None):
    core1 = normalize_japanese_address(addr1)
    core2 = normalize_japanese_address(addr2)
    return core1 == core2

def get_best_latlng(index, address, api_key, gsi_check=True, distance_threshold=200, priority="gsi", 
                    mode="distance", reverse_geocode_check=False, note_out=None, logger=None):
    lat1, lon1 = get_gmap_latlng(address, api_key)
    lat2, lon2 = get_gsi_latlng(address)

    if lat1 is None and lat2 is None:
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
        if lat1 is not None and lat2 is None:
            return lat1, lon1, "google"
        if lat2 is not None and lat1 is None:
            return lat2, lon2, "gsi"
        dist = haversine(lat1, lon1, lat2, lon2)
        if gsi_check and dist >= distance_threshold:
            if logger:
                pre_msg = f"警告: {index}行目 '{address}' のGoogle座標と国土地理院座標が {int(dist)}m ズレ。"
                if priority == "gsi":
                    logger(pre_msg + "国土地理院APIの座標を採用します。")
                elif priority == "google":
                    logger(pre_msg + "Google座標を採用します。")
            if note_out is not None:
                note_out.append("緯度経度は怪しい")
            return (lat2, lon2, "gsi") if priority == "gsi" else (lat1, lon1, "google")
        return lat1, lon1, "google"

    if lat1 is not None:
        return lat1, lon1, "google"
    if lat2 is not None:
        return lat2, lon2, "gsi"
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
    gsi_check=True, gsi_distance=200, priority="gsi", mode="distance", reverse_geocode_check=False
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

        full_api_address = f"{format_config['prefecture']}{format_config['city']}{normalized_address}"

        # 緯度経度（note_listを渡してget_best_latlng内でnote列をセット）
        lat, lng, source = get_best_latlng(
            idx, full_api_address, api_key, gsi_check, gsi_distance, priority, mode, reverse_geocode_check, note_list, log_callback
        )
        cache["latlng"] = (lat, lng)
        cache["source"] = source
        time.sleep(sleep_msec / 1000)

        for col_name in header:
            if col_name == "note":
                out_row.append("".join(str(item) for item in note_list))
            elif col_name == "address":
                out_row.append(clean(normalized_address))
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

def get_prefecture_from_partial_address(partial_address: str) -> str:
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch"
    params = {
        "q": partial_address
    }

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
