"""
ルート最適化ツール - メインアプリケーション
"""
import streamlit as st
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging
import os
from datetime import datetime

# ローカルモジュールインポート
from utils import (
    validate_coordinates, safe_execute, validate_api_key,
    create_google_maps_url, extract_voting_district,
    calculate_walking_time_minutes
)
from tsp_solver import TSPSolver
from route_optimizer import RouteOptimizer
from data_manager import GitHubDataManager
from storage_manager import GCSManager, LocalStorageManager

# ログ設定
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log') if os.getenv('APP_ENV') == 'production' else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

# 基本設定
st.set_page_config(page_title="ルート最適化ツール", layout="wide")

# ストレージマネージャーの初期化
@st.cache_resource
def init_storage_manager():
    """ストレージマネージャーを初期化"""
    # GCSを試行し、失敗したらローカルストレージ
    gcs_manager = GCSManager()
    if gcs_manager.bucket:
        logger.info("GCSストレージを使用")
        return gcs_manager
    else:
        logger.info("ローカルストレージを使用")
        return LocalStorageManager()

storage_manager = init_storage_manager()

# データマネージャーの初期化
@st.cache_resource
def init_data_manager():
    """データマネージャーを初期化"""
    return GitHubDataManager()

data_manager = init_data_manager()


def create_route_dataframe(result, points):
    """ルートデータフレームを作成"""
    route_data = []

    if 'district_info' in result:
        for district_info in result['district_info']:
            district = district_info['district']

            # 最適化されたルート順序に従って地点を取得
            route_indices = district_info['route']
            district_points = []

            # route_indicesが元のpointsリストのインデックスの場合
            if route_indices and all(isinstance(idx, int) and 0 <= idx < len(points) for idx in route_indices):
                district_points = [points[idx] for idx in route_indices]
            else:
                # route_indicesが投票区内のローカルインデックスの場合
                # 該当する投票区の地点のみを抽出してからインデックスを適用
                district_all_points = [p for p in points if extract_voting_district(p['number']) == district]
                district_points = [district_all_points[idx] for idx in route_indices if idx < len(district_all_points)]

            for order, point in enumerate(district_points):
                # 地点の投票区を確認（データ整合性チェック）
                point_district = extract_voting_district(point['number'])
                if point_district != district:
                    logger.warning(f"投票区不整合 - 期待:{district}, 実際:{point_district}, 地点:{point['number']}")

                route_data.append({
                    '投票区': district,  # 最適化結果の投票区を使用
                    '順序': order + 1,
                    '掲示板番号': point['number'],
                    '地点名': point['name'],
                    '住所': point['address'],
                    '緯度': point['lat'],
                    '経度': point['long'],
                    '投票区内地点数': len(district_points),
                    '投票区距離_m': f"{district_info['distance']:.0f}",
                    '推定時間_分': f"{calculate_walking_time_minutes(district_info['distance']):.0f}"
                })

    return pd.DataFrame(route_data)


def render_saved_routes_tab():
    """保存済みルートタブを表示"""
    st.subheader("📁 最適化済みルート")

    # サイドバーに閲覧者向け情報を表示
    st.sidebar.title("ℹ️ ルートについて")
    st.sidebar.markdown("""
    ### 最適化済みルートとは
    - 各投票区の掲示板を効率的に回るルートです
    - 道路距離を考慮して最適化されています
    - Google Mapsで実際のナビゲーションが可能です

    ### ルートの見方
    1. **都道府県・市区町村を選択**
    2. **投票区毎のルート**が表示されます
    3. **Google Mapsリンク**で実際のナビを確認
    """)

    # 保存済みルート一覧
    saved_routes = storage_manager.list_saved_routes()

    if not saved_routes:
        st.info("📝 保存されたルートがありません。新規最適化タブでルートを作成してください。")
        return

    # 都道府県選択
    prefectures = sorted(list(set(route['prefecture'] for route in saved_routes)))
    selected_prefecture = st.selectbox("都道府県を選択:", prefectures, key="saved_prefecture")

    # 市区町村選択
    cities = [route['city'] for route in saved_routes if route['prefecture'] == selected_prefecture]
    cities = sorted(list(set(cities)))
    selected_city = st.selectbox("市区町村を選択:", cities, key="saved_city")

    # 選択されたルートデータを読み込み
    route_data = next((route for route in saved_routes
                      if route['prefecture'] == selected_prefecture and route['city'] == selected_city), None)

    if not route_data:
        st.error("選択されたルートが見つかりません。")
        return

    # ルート表示（辞書形式からDataFrameに変換）
    route_df = pd.DataFrame(route_data['route_data']['route_df'])
    districts = route_df['投票区'].unique()

    st.write(f"**総距離**: {route_data['total_distance']:.0f}m")
    st.write(f"**推定時間**: {calculate_walking_time_minutes(route_data['total_distance']):.0f}分")

    # 投票区毎のルート表示
    try:
        sorted_districts = sorted(districts, key=lambda x: int(str(x)) if str(x).isdigit() else float('inf'))
    except (ValueError, TypeError, AttributeError):
        # ソートに失敗した場合はそのまま使用
        sorted_districts = districts

    for district in sorted_districts:
        # 該当する投票区のデータのみを取得し、順序でソート
        district_df = route_df[route_df['投票区'] == district].sort_values('順序').reset_index(drop=True)

        st.markdown(f"### 🏛️ 投票区 {district}")

        col1, col2 = st.columns(2)

        with col1:
            if len(district_df) > 0:
                st.write(f"**地点数**: {len(district_df)} 地点 | **距離**: {district_df.iloc[0]['投票区距離_m']}m | **推定時間**: {district_df.iloc[0]['推定時間_分']}分")

        with col2:
            # Google Mapsリンク生成
            district_points = []
            for _, row in district_df.iterrows():
                district_points.append({
                    'lat': row['緯度'],
                    'long': row['経度'],
                    'name': row['地点名']
                })

            if len(district_points) > 0:
                maps_url = create_google_maps_url(district_points, f"投票区{district}")
                st.link_button("🗺️ Google Mapsで表示", maps_url)

        # 地点詳細の表示
        with st.expander(f"📍 投票区 {district} の地点詳細を表示"):
            display_df = district_df[['順序', '掲示板番号', '地点名', '住所', '緯度', '経度']].copy()
            st.dataframe(display_df, use_container_width=True)


def render_new_optimization_tab():
    """新規最適化タブを表示"""
    st.subheader("🆕 新規ルート最適化")

    # サイドバーにAPIキー取得方法を表示
    st.sidebar.title("🔑 APIキーについて")
    st.sidebar.markdown("""
    ### OpenRouteService APIキー取得方法

    1. [サインアップ](https://account.heigit.org/signup) または [ログイン](https://account.heigit.org/login)
    2. [API Key管理ページ](https://account.heigit.org/manage/key) でキーを取得

    ### 制限事項
    - **リクエスト制限**: 40回/分
    - **無料プラン**: 月1000リクエスト
    """)

    # APIキー入力
    api_key = st.text_input("OpenRouteService APIキー:", type="password", key="api_key")

    if not validate_api_key(api_key):
        st.warning("⚠️ 有効なAPIキーを入力してください（10文字以上）")
        return

    # 都道府県取得
    prefectures = data_manager.get_prefectures()
    if not prefectures:
        st.error("都道府県一覧の取得に失敗しました。ネットワーク接続を確認してください。")
        return

    # 都道府県選択
    selected_prefecture = st.selectbox("都道府県を選択:", prefectures, key="new_prefecture")

    # 市区町村取得
    cities = data_manager.get_cities(selected_prefecture)
    if not cities:
        st.error(f"{selected_prefecture}の市区町村一覧の取得に失敗しました。")
        return

    # 市区町村選択
    selected_city = st.selectbox("市区町村を選択:", cities, key="new_city")

    # 既存ルートの確認
    saved_routes = storage_manager.list_saved_routes()
    existing_route = next((route for route in saved_routes
                          if route['prefecture'] == selected_prefecture and route['city'] == selected_city), None)

    if existing_route:
        st.warning(f"⚠️ {selected_prefecture}{selected_city}のルートは既に存在します。最適化を実行すると上書きされます。")

    # 最適化実行
    if st.button("🚀 最適化を実行", type="primary"):

        # データ取得
        with st.spinner("データを取得中..."):
            city_data = data_manager.get_city_data(selected_prefecture, selected_city)

        if city_data is None or city_data.empty:
            st.error("データの取得に失敗しました。")
            return

        # 必要な列の確認
        required_columns = ['number', 'name', 'address', 'lat', 'long']
        missing_columns = [col for col in required_columns if col not in city_data.columns]

        if missing_columns:
            st.error(f"データに必要な列が不足しています: {missing_columns}")
            return

        # 座標の検証
        coordinate_errors = []
        valid_points = []

        for idx, row in city_data.iterrows():
            lat, lon = row['lat'], row['long']
            if validate_coordinates(lat, lon):
                valid_points.append({
                    'number': row['number'],
                    'name': row['name'],
                    'address': row['address'],
                    'lat': lat,
                    'long': lon
                })
            else:
                coordinate_errors.append({
                    'row': idx + 1,
                    'number': row['number'],
                    'lat': lat,
                    'long': lon,
                    'reason': '座標値が範囲外または無効'
                })

        if coordinate_errors:
            st.error(f"❌ 座標エラーが{len(coordinate_errors)}件あります")
            if st.checkbox("エラー詳細を表示"):
                error_df = pd.DataFrame(coordinate_errors)
                st.dataframe(error_df)
            return

        if not valid_points:
            st.error("有効な地点がありません。")
            return

        st.success(f"✅ {len(valid_points)}地点のデータを読み込みました")

        # 最適化実行
        optimizer = RouteOptimizer(api_key)

        # 進捗表示用のプレースホルダー
        progress_placeholder = st.empty()

        def update_progress(message):
            progress_placeholder.info(f"🔄 {message}")

        try:
            with st.spinner("ルートを最適化中..."):
                result = optimizer.optimize_route(
                    valid_points,
                    use_road_distance=True,
                    group_by_district=True,
                    progress_callback=update_progress
                )

            progress_placeholder.empty()

            # 結果の表示と保存
            if result and 'district_info' in result:
                st.success("✅ 最適化が完了しました！")

                # データフレーム作成
                route_df = create_route_dataframe(result, valid_points)

                # 結果保存
                route_data = {
                    'route_df': route_df.to_dict('records'),
                    'district_info': result['district_info'],
                    'optimization_params': {
                        'use_road_distance': True,
                        'group_by_district': True,
                        'api_used': True
                    }
                }

                storage_manager.save_route(
                    route_data,
                    selected_prefecture,
                    selected_city,
                    result['total_distance']
                )

                st.success(f"💾 ルートを保存しました: {selected_prefecture}/{selected_city}")

                # 投票区別統計表示
                district_stats = []
                for district_info in result['district_info']:
                    district_stats.append({
                        '投票区': district_info['district'],
                        '地点数': district_info['point_count'],
                        '距離(m)': f"{district_info['distance']:.0f}",
                        '推定時間(分)': f"{calculate_walking_time_minutes(district_info['distance']):.0f}"
                    })

                st.write("### 📊 投票区別統計")
                stats_df = pd.DataFrame(district_stats)
                st.dataframe(stats_df, use_container_width=True)

                st.write(f"**総距離**: {result['total_distance']:.0f}m")
                st.write(f"**総推定時間**: {calculate_walking_time_minutes(result['total_distance']):.0f}分")

                # 結果をセッションに保存（タブ切り替え用）
                st.session_state.last_optimization = {
                    'prefecture': selected_prefecture,
                    'city': selected_city,
                    'route_df': route_df
                }

            else:
                st.error("❌ 最適化に失敗しました")

        except Exception as e:
            logger.error(f"最適化エラー: {e}", exc_info=True)
            st.error(f"❌ 最適化エラー: {str(e)}")


def main():
    """メイン関数"""
    st.title("🗺️ ポスター掲示板ルート最適化ツール")
    st.markdown("---")

    # タブ作成
    tab1, tab2 = st.tabs(["📁 最適化済みルート", "🆕 新規最適化"])

    with tab1:
        safe_execute(render_saved_routes_tab, "保存済みルート表示エラー")

    with tab2:
        safe_execute(render_new_optimization_tab, "新規最適化エラー")


if __name__ == "__main__":
    main()
