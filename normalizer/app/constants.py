"""
定数定義モジュール
API名やエンドポイントなどの共通定数を管理
"""
import os

# .envファイルの読み込み
try:
    from dotenv import load_dotenv
    # プロジェクトルートの.envファイルを読み込み
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    load_dotenv()  # カレントディレクトリの.envも読み込み
except ImportError:
    pass

API_DISPLAY_NAMES = {
    "google": "Google",
    "gsi": "国土地理院",
    "jageocoder": "Jageocoder"
}

# セキュリティ: APIエンドポイントは環境変数で設定可能
_DEFAULT_ENDPOINTS = {
    "google": "https://maps.googleapis.com/maps/api/geocode/json",
    "gsi": "https://msearch.gsi.go.jp/address-search/AddressSearch",
    "jageocoder": "https://jageocoder.tsuruharu.com/"  # デフォルトでJageocoderを使用
}

# JageocoderのベースURLから各エンドポイントを生成
def _build_jageocoder_endpoints():
    base_url = os.environ.get("JAGEOCODER_ENDPOINT", _DEFAULT_ENDPOINTS["jageocoder"])
    if base_url:
        # ベースURLの末尾のスラッシュを統一
        base_url = base_url.rstrip('/')
        return {
            "jageocoder": f"{base_url}/geocode",
            "jageocoder_reverse": f"{base_url}/rgeocode"
        }
    return {
        "jageocoder": "",
        "jageocoder_reverse": ""
    }

# API endpoints
jageocoder_endpoints = _build_jageocoder_endpoints()

API_ENDPOINTS = {
    "google": os.environ.get("GOOGLE_GEOCODING_ENDPOINT", _DEFAULT_ENDPOINTS["google"]),
    "gsi": os.environ.get("GSI_GEOCODING_ENDPOINT", _DEFAULT_ENDPOINTS["gsi"]),
    "jageocoder": jageocoder_endpoints["jageocoder"],
    "jageocoder_reverse": jageocoder_endpoints["jageocoder_reverse"]
}

JAPAN_LAT_RANGE = (20, 46)
JAPAN_LON_RANGE = (122, 154)

# 設定可能な値：環境変数で上書き可能
API_TIMEOUT = int(os.environ.get("API_TIMEOUT", "10"))
DEFAULT_DISTANCE_THRESHOLD = int(os.environ.get("DEFAULT_DISTANCE_THRESHOLD", "200"))
DEFAULT_SLEEP_MSEC = int(os.environ.get("DEFAULT_SLEEP_MSEC", "200"))
DEFAULT_REVERSE_GEOCODE_LEVEL = int(os.environ.get("DEFAULT_REVERSE_GEOCODE_LEVEL", "7"))