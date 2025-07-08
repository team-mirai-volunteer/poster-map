"""
共通ユーティリティ関数と定数
"""
import math
import logging
from typing import List, Dict
import streamlit as st

# ログ設定
logger = logging.getLogger(__name__)

# 定数
WALKING_SPEED_KM_H = 4.0

# API設定
API_POINT_LIMIT = 25
API_WAIT_TIME = 2
API_TIMEOUT = 30

# GitHub設定
GITHUB_BASE_URL = "https://raw.githubusercontent.com/team-mirai-volunteer/action-board/main/poster_data/data"
GITHUB_API_URL = "https://api.github.com/repos/team-mirai-volunteer/action-board/contents/poster_data/data"

# ローカルストレージ設定
LOCAL_STORAGE_DIR = "storage"
ROUTES_DIR = "routes"


def calculate_walking_time_minutes(distance_m: float) -> float:
    """歩行時間（分）を計算"""
    return distance_m / 1000 * 60 / WALKING_SPEED_KM_H


def calculate_straight_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """直線距離を計算（メートル）"""
    R = 6371000  # 地球の半径（メートル）
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def create_google_maps_url(points: List[Dict], title: str = "ルート") -> str:
    """Google Maps URLを作成"""
    if not points:
        return ""
    
    # 1地点の場合
    if len(points) == 1:
        point = points[0]
        return f"https://www.google.com/maps/place/{point['lat']},{point['long']}"
    
    # 2地点以上の場合 - すべての地点を順次経由するルート
    coords = []
    for point in points:
        coords.append(f"{point['lat']},{point['long']}")
    
    # すべての地点をスラッシュで区切って結合
    route_coords = "/".join(coords)
    
    return f"https://www.google.com/maps/dir/{route_coords}?travelmode=walking"


def extract_voting_district(number) -> str:
    """投票区を抽出"""
    if isinstance(number, (int, float)):
        number = str(number)
    
    # ハイフンで分割して最初の部分を取得
    district = str(number).split('-')[0]
    return district


def validate_coordinates(lat: float, lon: float) -> bool:
    """座標の妥当性をチェック"""
    try:
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            return False
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return False
        return True
    except Exception as e:
        logger.error(f"座標検証エラー: {e}")
        return False


def safe_execute(func, error_message: str = "処理中にエラーが発生しました", default_return=None):
    """安全な関数実行"""
    try:
        return func()
    except Exception as e:
        logger.error(f"{error_message}: {str(e)}", exc_info=True)
        st.error(f"❌ {error_message}")
        return default_return


def validate_api_key(api_key: str) -> bool:
    """APIキーの妥当性をチェック"""
    if not api_key or not isinstance(api_key, str):
        return False
    if len(api_key.strip()) < 10:
        return False
    return True

