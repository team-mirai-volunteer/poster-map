import csv
import json
import time
import requests
import unicodedata
import re
import os
from typing import Dict, List, Tuple, Any, Optional

KANJI_NUMERAL_MAP = {
    "〇": 0, "一": 1, "二": 2, "三": 3, "四": 4,
    "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
    "十": 10
}

def kanji_to_number(kanji: str) -> int:
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

def normalize_address_digits(addr: str) -> str:
    addr = unicodedata.normalize("NFKC", addr)
    addr = re.sub(r"[‐－―ー−]", "-", addr)
    def replacer(match):
        kanji = match.group(1)
        unit = match.group(2)
        return f"{kanji_to_number(kanji)}{unit}"
    return re.sub(r"([〇一二三四五六七八九十]+)(丁目|番|号)", replacer, addr).strip().strip("　")

def clean(val: Any) -> str:
    return val.strip().strip("　") if isinstance(val, str) else str(val)

def get_lat_lng(address: str, api_key: str) -> Tuple[str, str]:
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": api_key}
    try:
        res = requests.get(url, params=params)
        data = res.json()
        status = data.get("status")
        if status == "OK":
            loc = data["results"][0]["geometry"]["location"]
            return str(loc["lat"]), str(loc["lng"])
        elif status == "REQUEST_DENIED":
            error_msg = data.get('error_message', 'APIキーが無効です。')
            return f"ERROR:REQUEST_DENIED", f"ERROR:{error_msg}"
        else:
            return f"ERROR:{status}", f"ERROR:{status}"
    except Exception as e:
        return f"ERROR:{str(e)}", f"ERROR:{str(e)}"

def render_template(template_str: str, row: List[str], cache: Dict[str, Any], 
                   full_api_address: str, api_key: str, sleep_msec: int) -> str:
    def replacer(match):
        token = match.group(1)
        if token.isdigit():
            idx = int(token) - 1
            return clean(row[idx]) if idx < len(row) else ""
        elif token in ("lat", "long"):
            if "latlng" not in cache:
                lat, lng = get_lat_lng(full_api_address, api_key)
                cache["latlng"] = (lat, lng)
                time.sleep(sleep_msec / 1000)
            lat, lng = cache["latlng"]
            return str(clean(lat if token == "lat" else lng))
        else:
            return ""
    return re.sub(r"\{([^{}]+)\}", replacer, template_str)

def process_csv_data(csv_data: List[List[str]], config: Dict[str, Any], 
                    progress_callback: Optional[Any] = None) -> List[List[str]]:
    format_config = config["format"]
    header = list(format_config.keys())
    
    api_needed = any("{lat}" in v or "{long}" in v for v in format_config.values())
    api_key = config.get("api", {}).get("key") if api_needed else None
    sleep_msec = int(config.get("api", {}).get("sleep", 200)) if api_needed else 200
    
    if api_needed and not api_key:
        raise ValueError("緯度経度を取得するにはAPIキーが必要です。")
    
    results = [header]
    
    for idx, row in enumerate(csv_data, start=1):
        if progress_callback:
            progress_callback(idx, len(csv_data))
            
        out_row = []
        cache = {}
        
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
        
        for col_name, template in format_config.items():
            if col_name == "address":
                out_row.append(clean(normalized_address))
            else:
                rendered = render_template(template, row, cache, full_api_address, api_key or "", sleep_msec)
                out_row.append(rendered)
        
        results.append(out_row)
    
    return results

def create_config_from_params(prefecture: str, city: str, column_mapping: Dict[str, int],
                             api_key: str, sleep_ms: int = 200, 
                             normalize_digits: bool = False) -> Dict[str, Any]:
    format_config = {
        "prefecture": prefecture,
        "city": city
    }
    
    for field_name, column_index in column_mapping.items():
        if field_name in ["number", "address", "name"]:
            format_config[field_name] = f"{{{column_index}}}"
        elif field_name in ["lat", "long"]:
            format_config[field_name] = f"{{{field_name}}}"
    
    return {
        "api": {
            "key": api_key,
            "sleep": sleep_ms
        },
        "format": format_config,
        "normalize_address_digits": normalize_digits
    }
