"""
定数定義モジュール
API名やエンドポイントなどの共通定数を管理
"""

# API名の表示用マッピング
API_DISPLAY_NAMES = {
    "google": "Google",
    "gsi": "国土地理院",
    "jageocoder": "Jageocoder"
}

# APIエンドポイント
API_ENDPOINTS = {
    "google": "https://maps.googleapis.com/maps/api/geocode/json",
    "gsi": "https://msearch.gsi.go.jp/address-search/AddressSearch",
    "jageocoder": "https://jageocoder.tsuruharu.com/geocode",  # HTTPSに更新
    "jageocoder_reverse": "https://jageocoder.tsuruharu.com/rgeocode"  # HTTPSに更新
}

# 座標の有効範囲（日本）
JAPAN_LAT_RANGE = (20, 46)  # 緯度の範囲
JAPAN_LON_RANGE = (122, 154)  # 経度の範囲

# APIタイムアウト設定（秒）
API_TIMEOUT = 10

# デフォルト設定
DEFAULT_DISTANCE_THRESHOLD = 200  # メートル
DEFAULT_SLEEP_MSEC = 200  # ミリ秒
DEFAULT_REVERSE_GEOCODE_LEVEL = 7  # 住所レベル（番地）