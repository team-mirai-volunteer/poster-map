"""
定数定義モジュール
API名やエンドポイントなどの共通定数を管理
"""

API_DISPLAY_NAMES = {
    "google": "Google",
    "gsi": "国土地理院",
    "jageocoder": "Jageocoder"
}

API_ENDPOINTS = {
    "google": "https://maps.googleapis.com/maps/api/geocode/json",
    "gsi": "https://msearch.gsi.go.jp/address-search/AddressSearch",
    "jageocoder": "https://jageocoder.tsuruharu.com/geocode",
    "jageocoder_reverse": "https://jageocoder.tsuruharu.com/rgeocode"
}

JAPAN_LAT_RANGE = (20, 46)
JAPAN_LON_RANGE = (122, 154)

API_TIMEOUT = 10

DEFAULT_DISTANCE_THRESHOLD = 200
DEFAULT_SLEEP_MSEC = 200
DEFAULT_REVERSE_GEOCODE_LEVEL = 7