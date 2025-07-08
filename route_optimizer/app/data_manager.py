"""
GitHub データマネージャー
team-mirai-volunteer/action-board からデータを取得
"""
import streamlit as st
import pandas as pd
import requests
import io
from typing import List, Optional
import logging

from utils import GITHUB_BASE_URL, GITHUB_API_URL

logger = logging.getLogger(__name__)


class GitHubDataManager:
    """GitHub データマネージャー"""

    def __init__(self):
        self.base_url = GITHUB_BASE_URL
        self.api_url = GITHUB_API_URL

    @st.cache_data(ttl=3600)
    def get_prefectures(_self) -> List[str]:
        """都道府県一覧を取得"""
        try:
            response = requests.get(f"{_self.api_url}?ref=main", timeout=10)
            response.raise_for_status()

            dirs_data = response.json()
            prefectures = []

            for dir_info in dirs_data:
                if dir_info['type'] == 'dir':
                    prefectures.append(dir_info['name'])

            return sorted(prefectures)
        except Exception as e:
            logger.error(f"都道府県一覧取得エラー: {e}")
            st.error(f"都道府県一覧の取得に失敗: {e}")
            return []

    @st.cache_data(ttl=1800)
    def get_cities(_self, prefecture: str) -> List[str]:
        """市区町村一覧を取得"""
        try:
            response = requests.get(f"{_self.api_url}/{prefecture}?ref=main", timeout=10)
            response.raise_for_status()

            files_data = response.json()
            cities = []

            for file_info in files_data:
                if file_info['name'].endswith('.csv') and file_info['type'] == 'file':
                    city = file_info['name'].replace('.csv', '')
                    if city.endswith('_normalized'):
                        city = city.replace('_normalized', '')
                    cities.append(city)

            return sorted(cities)
        except Exception as e:
            logger.error(f"市区町村一覧取得エラー: {e}")
            st.error(f"市区町村一覧の取得に失敗: {e}")
            return []

    @st.cache_data(ttl=1800)
    def get_city_data(_self, prefecture: str, city: str) -> Optional[pd.DataFrame]:
        """市区町村データを取得"""
        try:
            # 正規化ファイルを優先
            normalized_url = f"{_self.base_url}/{prefecture}/{city}_normalized.csv"
            response = requests.get(normalized_url, timeout=30)

            if response.status_code != 200:
                # 通常ファイルを試行
                normal_url = f"{_self.base_url}/{prefecture}/{city}.csv"
                response = requests.get(normal_url, timeout=30)

            response.raise_for_status()

            csv_data = io.StringIO(response.text)
            df = pd.read_csv(csv_data)

            logger.info(f"データ取得成功: {prefecture}/{city} ({len(df)} 行)")
            return df
        except Exception as e:
            logger.error(f"市区町村データ取得エラー: {e}")
            st.error(f"データ取得に失敗: {e}")
            return None
