"""
ストレージマネージャー
GCSとローカルストレージの管理
"""
import os
import json
import streamlit as st
from typing import Dict, List
from datetime import datetime
import logging

try:
    from google.cloud import storage as gcs
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

from utils import LOCAL_STORAGE_DIR, ROUTES_DIR

logger = logging.getLogger(__name__)


class GCSManager:
    """GCSストレージマネージャー"""
    
    def __init__(self):
        self.bucket_name = os.getenv('GCS_BUCKET_NAME', '')
        self.routes_prefix = "routes/"
        self.client = None
        self.bucket = None
        
        if self.bucket_name and GCS_AVAILABLE:
            try:
                self.client = gcs.Client()
                self.bucket = self.client.bucket(self.bucket_name)
                logger.info(f"GCS接続成功: {self.bucket_name}")
            except Exception as e:
                logger.error(f"GCS接続エラー: {e}")
                st.warning(f"⚠️ GCS接続エラー: ローカルストレージを使用します")
    
    def save_route(self, route_data: Dict, prefecture: str, city: str, total_distance: float):
        """ルートデータをGCSに保存"""
        if not self.bucket:
            raise Exception("GCSが利用できません")
        
        blob_name = f"{self.routes_prefix}{prefecture}/{city}.json"
        
        save_data = {
            'prefecture': prefecture,
            'city': city,
            'total_distance': total_distance,
            'saved_at': datetime.now().isoformat(),
            'route_data': route_data
        }
        
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(
            json.dumps(save_data, ensure_ascii=False, indent=2),
            content_type='application/json'
        )
        logger.info(f"GCSに保存: {blob_name}")
    
    def list_saved_routes(self) -> List[Dict]:
        """GCSから保存済みルート一覧を取得"""
        if not self.bucket:
            return []
        
        routes = []
        blobs = self.bucket.list_blobs(prefix=self.routes_prefix)
        
        for blob in blobs:
            if blob.name.endswith('.json'):
                try:
                    content = blob.download_as_text()
                    data = json.loads(content)
                    routes.append(data)
                except Exception as e:
                    logger.error(f"GCSファイル読み込みエラー {blob.name}: {e}")
                    st.error(f"GCSファイル読み込みエラー {blob.name}: {e}")
        
        return routes


class LocalStorageManager:
    """ローカルストレージマネージャー"""
    
    def __init__(self):
        self.storage_dir = LOCAL_STORAGE_DIR
        self.routes_dir = os.path.join(self.storage_dir, ROUTES_DIR)
        self._ensure_directories()
    
    def _ensure_directories(self):
        """ディレクトリの存在確認・作成"""
        os.makedirs(self.routes_dir, exist_ok=True)
        logger.info(f"ローカルストレージディレクトリ確認: {self.routes_dir}")
    
    def save_route(self, route_data: Dict, prefecture: str, city: str, total_distance: float):
        """ルートデータを保存"""
        # 都道府県別ディレクトリを作成
        prefecture_dir = os.path.join(self.routes_dir, prefecture)
        os.makedirs(prefecture_dir, exist_ok=True)
        
        filename = f"{city}.json"
        filepath = os.path.join(prefecture_dir, filename)
        
        save_data = {
            'prefecture': prefecture,
            'city': city,
            'total_distance': total_distance,
            'saved_at': datetime.now().isoformat(),
            'route_data': route_data
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"ローカルに保存: {filepath}")
    
    def list_saved_routes(self) -> List[Dict]:
        """保存済みルート一覧を取得"""
        routes = []
        
        if not os.path.exists(self.routes_dir):
            return routes
            
        # 都道府県ディレクトリを走査
        for prefecture_name in os.listdir(self.routes_dir):
            prefecture_path = os.path.join(self.routes_dir, prefecture_name)
            if os.path.isdir(prefecture_path):
                # 各都道府県内のJSONファイルを走査
                for filename in os.listdir(prefecture_path):
                    if filename.endswith('.json'):
                        filepath = os.path.join(prefecture_path, filename)
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                data = json.load(f)
                                routes.append(data)
                        except Exception as e:
                            logger.error(f"ファイル読み込みエラー {prefecture_name}/{filename}: {e}")
                            st.error(f"ファイル読み込みエラー {prefecture_name}/{filename}: {e}")
            elif prefecture_name.endswith('.json'):
                # 旧形式のファイル（都道府県_市区町村.json）をサポート
                filepath = os.path.join(self.routes_dir, prefecture_name)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        routes.append(data)
                except Exception as e:
                    logger.error(f"ファイル読み込みエラー {prefecture_name}: {e}")
                    st.error(f"ファイル読み込みエラー {prefecture_name}: {e}")
        
        return routes