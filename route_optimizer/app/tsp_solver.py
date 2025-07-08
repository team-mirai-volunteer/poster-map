"""
TSP（巡回セールスマン問題）ソルバー
2-opt法と最近傍法を使用した最適化エンジン
"""
import numpy as np
from typing import List


class TSPSolver:
    """TSP（巡回セールスマン問題）ソルバー"""

    def __init__(self):
        self.distance_matrix = None
        self.n = 0

    def set_distance_matrix(self, matrix: np.ndarray):
        """距離行列を設定"""
        if matrix is None:
            raise ValueError("距離行列がNoneです")
        if not isinstance(matrix, np.ndarray):
            raise TypeError("距離行列はnumpy配列である必要があります")
        if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
            raise ValueError("距離行列は正方行列である必要があります")
        if matrix.shape[0] == 0:
            raise ValueError("距離行列が空です")
        if np.any(matrix < 0):
            raise ValueError("距離行列に負の値が含まれています")
        self.distance_matrix = matrix
        self.n = len(matrix)

    def nearest_neighbor(self, start: int = 0) -> List[int]:
        """最近傍法で初期解を生成"""
        unvisited = set(range(self.n))
        route = [start]
        unvisited.remove(start)

        current = start
        while unvisited:
            nearest = min(unvisited, key=lambda x: self.distance_matrix[current][x])
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        return route

    def calculate_route_distance(self, route: List[int], close_loop: bool = False) -> float:
        """ルートの総距離を計算"""
        if len(route) < 2:
            return 0.0

        total_distance = 0.0
        for i in range(len(route) - 1):
            total_distance += self.distance_matrix[route[i]][route[i + 1]]

        if close_loop and len(route) > 2:
            total_distance += self.distance_matrix[route[-1]][route[0]]

        return total_distance

    def two_opt_improve(self, route: List[int], close_loop: bool = False) -> List[int]:
        """2-opt改善"""
        best_route = route[:]
        best_distance = self.calculate_route_distance(best_route, close_loop)

        improved = True
        iterations = 0
        max_iterations = 50

        while improved and iterations < max_iterations:
            improved = False
            iterations += 1

            for i in range(len(route) - 1):
                for j in range(i + 1, len(route)):
                    # 2-opt swap
                    new_route = route[:]
                    new_route[i:j+1] = reversed(new_route[i:j+1])

                    new_distance = self.calculate_route_distance(new_route, close_loop)

                    if new_distance < best_distance:
                        best_route = new_route
                        best_distance = new_distance
                        improved = True
                        break

                if improved:
                    break

            route = best_route

        return best_route

    def solve(self, start: int = 0, close_loop: bool = False) -> tuple:
        """TSPを解く

        Args:
            start: 開始点のインデックス
            close_loop: 開始点に戻るかどうか

        Returns:
            tuple: (最適化されたルート, 総距離)
        """
        if self.n <= 1:
            return [0], 0.0

        # 最近傍法で初期解を生成
        route = self.nearest_neighbor(start)

        # 2-opt改善
        route = self.two_opt_improve(route, close_loop)

        # 距離を計算
        total_distance = self.calculate_route_distance(route, close_loop)

        return route, total_distance
