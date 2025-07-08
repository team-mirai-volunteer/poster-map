"""
ルート最適化エンジン
OpenRouteService APIクライアントとTSPソルバーを統合
"""
import numpy as np
import requests
import time
import streamlit as st
from typing import List, Dict, Optional
import logging

from tsp_solver import TSPSolver
from utils import (
    API_TIMEOUT, API_WAIT_TIME, calculate_straight_distance,
    extract_voting_district
)

logger = logging.getLogger(__name__)


class OpenRouteServiceClient:
    """OpenRouteService API クライアント"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openrouteservice.org/v2"

    def get_distance_matrix(self, points: List[tuple], profile: str = "foot-walking") -> np.ndarray:
        """距離行列を取得"""
        if not points:
            return np.array([])

        n = len(points)
        if n == 1:
            return np.array([[0.0]])

        # API呼び出し
        locations = [[lon, lat] for lat, lon in points]
        url = f"{self.base_url}/matrix/{profile}"

        headers = {
            "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
            "Authorization": self.api_key,
            "Content-Type": "application/json; charset=utf-8"
        }

        data = {
            "locations": locations,
            "metrics": ["distance"]
        }

        try:
            response = requests.post(url, json=data, headers=headers, timeout=API_TIMEOUT)
            response.raise_for_status()

            result = response.json()
            distances = result["distances"]

            # numpy配列に変換
            matrix = np.array(distances)

            # API制限回避の待機
            time.sleep(API_WAIT_TIME)

            return matrix

        except Exception as e:
            raise Exception(f"API呼び出しエラー: {str(e)}")


class RouteOptimizer:
    """ルート最適化エンジン"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = None
        if api_key:
            self.client = OpenRouteServiceClient(api_key)

    def calculate_distance_matrix(self, points: List[tuple], use_road_distance: bool = True) -> np.ndarray:
        """距離行列を計算"""
        if not points:
            return np.array([])

        n = len(points)
        if n == 1:
            return np.array([[0.0]])

        if use_road_distance and self.client:
            try:
                return self.client.get_distance_matrix(points)
            except Exception as e:
                st.warning(f"API呼び出しエラー、直線距離にフォールバック: {str(e)}")
                return self._calculate_straight_distance_matrix(points)
        else:
            return self._calculate_straight_distance_matrix(points)

    def _calculate_straight_distance_matrix(self, points: List[tuple]) -> np.ndarray:
        """直線距離の距離行列を計算"""
        n = len(points)
        matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(n):
                if i != j:
                    lat1, lon1 = points[i]
                    lat2, lon2 = points[j]
                    matrix[i][j] = calculate_straight_distance(lat1, lon1, lat2, lon2)

        return matrix

    def optimize_route(self, points: List[Dict], use_road_distance: bool = True,
                      group_by_district: bool = False, progress_callback: Optional[callable] = None) -> Dict:
        """ルートを最適化"""
        if group_by_district:
            return self._optimize_by_district(points, use_road_distance, progress_callback)

        # 座標リストを抽出
        coords = [(p['lat'], p['long']) for p in points]

        # 距離行列を計算
        distance_matrix = self.calculate_distance_matrix(coords, use_road_distance)

        # TSPソルバーで最適化
        solver = TSPSolver()
        solver.set_distance_matrix(distance_matrix)
        route, total_distance = solver.solve(start=0, close_loop=False)

        return {
            'route': route,
            'optimized_points': [points[i] for i in route],
            'total_distance': total_distance,
            'distance_unit': 'meters',
            'close_loop': False
        }

    def _optimize_by_district(self, points: List[Dict], use_road_distance: bool,
                             progress_callback: Optional[callable] = None) -> Dict:
        """投票区毎にルートを最適化"""
        # 投票区でグループ化
        districts = {}
        for i, point in enumerate(points):
            district = extract_voting_district(point['number'])
            if district not in districts:
                districts[district] = []
            districts[district].append({'index': i, 'point': point})

        district_info = []
        all_optimized_points = []
        total_distance = 0.0

        for district, district_points in districts.items():
            if progress_callback:
                progress_callback(f"投票区 {district} を最適化中... ({len(district_points)} 地点)")

            district_point_list = [dp['point'] for dp in district_points]

            if len(district_point_list) == 1:
                # 1地点の場合は最適化不要
                district_result = {
                    'route': [0],
                    'optimized_points': district_point_list,
                    'total_distance': 0.0
                }
            else:
                # 投票区内での最適化
                district_result = self.optimize_route(district_point_list, use_road_distance, False)

            # 元のインデックスを復元
            district_route = [district_points[i]['index'] for i in district_result['route']]

            district_info.append({
                'district': district,
                'point_count': len(district_points),
                'distance': district_result['total_distance'],
                'route': district_route
            })

            all_optimized_points.extend(district_result['optimized_points'])
            total_distance += district_result['total_distance']

        return {
            'district_info': district_info,
            'optimized_points': all_optimized_points,
            'total_distance': total_distance,
            'distance_unit': 'meters'
        }
