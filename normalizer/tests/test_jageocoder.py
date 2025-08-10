#!/usr/bin/env python3

import sys
import os

# テスト環境設定を最初に実行
from test_config import setup_test_environment
setup_test_environment()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from geo_processor import (
    get_jageocoder_latlng, get_gmap_latlng, get_gsi_latlng, haversine,
    reverse_geocode_jageocoder, reverse_geocode_google
)
from constants import API_ENDPOINTS

def check_jageocoder_endpoints():
    """Jageocoderエンドポイントの有効性をチェック"""
    if not API_ENDPOINTS["jageocoder"] or not API_ENDPOINTS["jageocoder_reverse"]:
        print("[SKIP] Jageocoderエンドポイントが無効化されています。")
        print("テスト用に環境変数JAGEOCODER_ENDPOINTを設定してください。")
        return False
    return True

def test_jageocoder_api():
    """
    Test Jageocoder API functionality
    """
    print("=== Test: Jageocoder API ===")
    
    # エンドポイント有効性チェック
    if not check_jageocoder_endpoints():
        return False
    
    print(f"使用エンドポイント: {API_ENDPOINTS['jageocoder']}")
    print(f"逆引きエンドポイント: {API_ENDPOINTS['jageocoder_reverse']}")
    
    test_addresses = [
        {
            "address": "東京都中央区京橋1丁目19番13号",
            "area": "東京都",
            "description": "中央区京橋の住所"
        },
        {
            "address": "東京都新宿区西新宿2丁目8番1号",
            "area": "東京都",
            "description": "新宿区西新宿の住所"
        },
        {
            "address": "大阪府大阪市北区梅田1丁目1番",
            "area": "大阪府",
            "description": "大阪市北区梅田の住所"
        }
    ]
    
    all_passed = True
    
    for case in test_addresses:
        print(f"\nテスト: {case['description']}")
        print(f"住所: {case['address']}")
        
        # Jageocoder APIで座標取得
        lat, lon = get_jageocoder_latlng(case['address'], case.get('area'))
        
        if lat is not None and lon is not None:
            print(f"[OK] Jageocoder座標: {lat:.6f}, {lon:.6f}")
        else:
            print(f"[NG] Jageocoderで座標を取得できませんでした")
            all_passed = False
    
    return all_passed

def test_api_comparison():
    """
    3つのAPIの結果を比較するテスト
    """
    print("\n=== Test: API結果の比較 ===")
    
    # エンドポイント有効性チェック
    if not check_jageocoder_endpoints():
        return False
    
    # テスト用の住所
    address = "東京都中央区京橋1丁目19番13号"
    area = "東京都"
    
    print(f"テスト住所: {address}")
    
    # 各APIで座標取得
    lat_jageocoder, lon_jageocoder = get_jageocoder_latlng(address, area)
    lat_gsi, lon_gsi = get_gsi_latlng(address)
    
    # Google Maps APIキーがある場合のみテスト
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    lat_google, lon_google = (None, None)
    if api_key:
        lat_google, lon_google = get_gmap_latlng(address, api_key)
    
    results = []
    if lat_jageocoder is not None:
        results.append(("Jageocoder", lat_jageocoder, lon_jageocoder))
        print(f"Jageocoder: {lat_jageocoder:.6f}, {lon_jageocoder:.6f}")
    
    if lat_gsi is not None:
        results.append(("国土地理院", lat_gsi, lon_gsi))
        print(f"国土地理院: {lat_gsi:.6f}, {lon_gsi:.6f}")
    
    if lat_google is not None:
        results.append(("Google", lat_google, lon_google))
        print(f"Google: {lat_google:.6f}, {lon_google:.6f}")
    
    # 座標間の距離を計算
    if len(results) >= 2:
        print("\n座標間の距離:")
        for i in range(len(results)):
            for j in range(i + 1, len(results)):
                name1, lat1, lon1 = results[i]
                name2, lat2, lon2 = results[j]
                distance = haversine(lat1, lon1, lat2, lon2)
                print(f"  {name1} - {name2}: {distance:.1f}m")
    
    return len(results) > 0

def test_reverse_geocoding():
    """
    逆ジオコーディング機能のテスト
    """
    print("\n=== Test: 逆ジオコーディング ===")
    
    # エンドポイント有効性チェック
    if not check_jageocoder_endpoints():
        return False
    
    # テスト用の座標（東京駅周辺）
    test_coords = [
        {"lat": 35.681236, "lon": 139.767125, "description": "東京駅周辺"},
        {"lat": 35.677975, "lon": 139.774460, "description": "中央区京橋付近"},
    ]
    
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    
    for coord in test_coords:
        print(f"\nテスト座標: {coord['description']}")
        print(f"緯度経度: {coord['lat']:.6f}, {coord['lon']:.6f}")
        
        # Google逆ジオコーディング
        if api_key:
            google_addr = reverse_geocode_google(coord['lat'], coord['lon'], api_key)
            if google_addr:
                print(f"Google逆引き: {google_addr}")
            else:
                print("Google逆引き: [NG] 取得失敗")
        else:
            print("Google逆引き: [SKIP] APIキーなし")
        
        # Jageocoder逆ジオコーディング
        jageocoder_addr = reverse_geocode_jageocoder(coord['lat'], coord['lon'])
        if jageocoder_addr:
            print(f"Jageocoder逆引き: {jageocoder_addr}")
        else:
            print("Jageocoder逆引き: [NG] 取得失敗")
    
    return True

def test_comprehensive_geocoding():
    """
    包括的なジオコーディングテスト（順方向 → 逆方向の検証）
    """
    # エンドポイント有効性チェック
    if not check_jageocoder_endpoints():
        return False
    print("\n=== Test: 包括的ジオコーディング ===")
    
    test_address = "東京都中央区京橋1丁目19番13号"
    area = "東京都"
    
    print(f"元の住所: {test_address}")
    
    # 各APIで座標を取得
    coords = {}
    
    # Jageocoder
    lat, lon = get_jageocoder_latlng(test_address, area)
    if lat and lon:
        coords["jageocoder"] = (lat, lon)
        print(f"Jageocoder座標: {lat:.6f}, {lon:.6f}")
    
    # 国土地理院
    lat, lon = get_gsi_latlng(test_address)
    if lat and lon:
        coords["gsi"] = (lat, lon)
        print(f"国土地理院座標: {lat:.6f}, {lon:.6f}")
    
    # Google（APIキーがある場合のみ）
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if api_key:
        lat, lon = get_gmap_latlng(test_address, api_key)
        if lat and lon:
            coords["google"] = (lat, lon)
            print(f"Google座標: {lat:.6f}, {lon:.6f}")
    
    # 各座標で逆ジオコーディングを試行
    if coords:
        print("\n逆ジオコーディング結果:")
        for api_name, (lat, lon) in coords.items():
            print(f"\n{api_name}の座標({lat:.6f}, {lon:.6f})から:")
            
            # Google逆引き
            if api_key:
                reverse_addr = reverse_geocode_google(lat, lon, api_key)
                if reverse_addr:
                    print(f"  Google逆引き: {reverse_addr}")
                else:
                    print(f"  Google逆引き: [NG] 取得失敗")
            
            # Jageocoder逆引き
            reverse_addr = reverse_geocode_jageocoder(lat, lon)
            if reverse_addr:
                print(f"  Jageocoder逆引き: {reverse_addr}")
            else:
                print(f"  Jageocoder逆引き: [NG] 取得失敗")
    
    return len(coords) > 0

def main():
    print("Jageocoder API統合テスト")
    print("=" * 50)
    
    # Jageocoder APIのテスト
    test1_passed = test_jageocoder_api()
    
    # API比較テスト
    test2_passed = test_api_comparison()
    
    # 逆ジオコーディングテスト
    test3_passed = test_reverse_geocoding()
    
    # 包括的テスト
    test4_passed = test_comprehensive_geocoding()
    
    print("\n" + "=" * 50)
    all_tests_passed = test1_passed and test2_passed and test3_passed and test4_passed
    
    # pytest用の最終アサーション
    assert all_tests_passed, "Some Jageocoder tests failed"
    
    if all_tests_passed:
        print("[SUCCESS] すべてのテストが成功しました")
        return 0
    else:
        print("[FAILED] 一部のテストが失敗しました")
        return 1

if __name__ == "__main__":
    sys.exit(main())