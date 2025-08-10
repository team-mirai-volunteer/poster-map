#!/usr/bin/env python3
"""
国土地理院APIとJageocoder APIの座標比較テスト
両APIが同じデータソースを使用しているか検証
"""

import sys
import os
import requests
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from geo_processor import get_gsi_latlng, get_jageocoder_latlng, haversine

def test_api_responses_direct():
    """
    両APIの生のレスポンスを比較
    """
    print("=== 国土地理院API vs Jageocoder API 詳細比較 ===\n")
    
    test_addresses = [
        "東京都中央区京橋1丁目19番13号",
        "東京都新宿区西新宿2丁目8番1号",
        "大阪府大阪市北区梅田1丁目1番",
        "北海道札幌市中央区北1条西2丁目",
        "福岡県福岡市博多区博多駅前1丁目1番"
    ]
    
    for address in test_addresses:
        print(f"テスト住所: {address}")
        print("-" * 60)
        
        # 国土地理院API
        print("【国土地理院API】")
        gsi_url = "https://msearch.gsi.go.jp/address-search/AddressSearch"
        gsi_params = {"q": address}
        try:
            gsi_res = requests.get(gsi_url, params=gsi_params, timeout=10)
            gsi_data = gsi_res.json()
            print(f"  エンドポイント: {gsi_url}")
            print(f"  レスポンス（最初の1件）:")
            if gsi_data and len(gsi_data) > 0:
                print(json.dumps(gsi_data[0], indent=4, ensure_ascii=False))
                if "geometry" in gsi_data[0] and "coordinates" in gsi_data[0]["geometry"]:
                    lon, lat = gsi_data[0]["geometry"]["coordinates"]
                    print(f"  座標: {lat:.6f}, {lon:.6f}")
            else:
                print("  結果なし")
        except Exception as e:
            print(f"  エラー: {e}")
        
        print()
        
        # Jageocoder API
        print("【Jageocoder API】")
        jageocoder_url = "http://jageocoder.tsuruharu.com/geocode"
        jageocoder_params = {"addr": address}
        try:
            jageocoder_res = requests.get(jageocoder_url, params=jageocoder_params, timeout=10)
            jageocoder_data = jageocoder_res.json()
            print(f"  エンドポイント: {jageocoder_url}")
            print(f"  レスポンス（最初の1件）:")
            if jageocoder_data and len(jageocoder_data) > 0:
                print(json.dumps(jageocoder_data[0], indent=4, ensure_ascii=False))
                if "node" in jageocoder_data[0]:
                    node = jageocoder_data[0]["node"]
                    if "x" in node and "y" in node:
                        lat = node["y"]
                        lon = node["x"]
                        print(f"  座標: {lat:.6f}, {lon:.6f}")
            else:
                print("  結果なし")
        except Exception as e:
            print(f"  エラー: {e}")
        
        print()
        
        # 座標比較
        print("【座標比較】")
        gsi_lat, gsi_lon = get_gsi_latlng(address)
        jageocoder_lat, jageocoder_lon = get_jageocoder_latlng(address)
        
        if gsi_lat and jageocoder_lat:
            distance = haversine(gsi_lat, gsi_lon, jageocoder_lat, jageocoder_lon)
            print(f"  国土地理院: {gsi_lat:.6f}, {gsi_lon:.6f}")
            print(f"  Jageocoder: {jageocoder_lat:.6f}, {jageocoder_lon:.6f}")
            print(f"  座標間の距離: {distance:.1f}m")
            
            if distance < 1.0:
                print("  [WARNING] 座標が完全に一致（同じデータソースの可能性）")
            elif distance < 10.0:
                print("  [WARNING] 座標がほぼ一致（同じデータソースの可能性が高い）")
            else:
                print(f"  [OK] 座標に差異あり（別々のデータソース）")
        else:
            if not gsi_lat:
                print("  国土地理院: 座標取得失敗")
            if not jageocoder_lat:
                print("  Jageocoder: 座標取得失敗")
        
        print("\n" + "=" * 80 + "\n")

def analyze_data_source():
    """
    データソースの分析
    """
    print("=== データソース分析 ===\n")
    
    # 複数の住所で統計を取る
    test_addresses = [
        "東京都千代田区永田町1丁目7番1号",
        "東京都港区芝公園4丁目2番8号",
        "東京都渋谷区道玄坂1丁目12番1号",
        "東京都文京区本郷7丁目3番1号",
        "東京都台東区上野7丁目1番",
    ]
    
    identical_count = 0
    nearly_identical_count = 0
    different_count = 0
    
    for address in test_addresses:
        gsi_lat, gsi_lon = get_gsi_latlng(address)
        jageocoder_lat, jageocoder_lon = get_jageocoder_latlng(address)
        
        if gsi_lat and jageocoder_lat:
            distance = haversine(gsi_lat, gsi_lon, jageocoder_lat, jageocoder_lon)
            if distance < 1.0:
                identical_count += 1
            elif distance < 10.0:
                nearly_identical_count += 1
            else:
                different_count += 1
    
    total = identical_count + nearly_identical_count + different_count
    
    print(f"検証住所数: {len(test_addresses)}")
    print(f"有効な比較数: {total}")
    print(f"完全一致（<1m）: {identical_count}件 ({identical_count/total*100:.1f}%)" if total > 0 else "データなし")
    print(f"ほぼ一致（<10m）: {nearly_identical_count}件 ({nearly_identical_count/total*100:.1f}%)" if total > 0 else "データなし")
    print(f"差異あり（>=10m）: {different_count}件 ({different_count/total*100:.1f}%)" if total > 0 else "データなし")
    
    print("\n【結論】")
    if total > 0:
        if (identical_count + nearly_identical_count) / total > 0.8:
            print("[WARNING] 両APIは同じ、または非常に類似したデータソースを使用している可能性が高いです。")
        else:
            print("[OK] 両APIは異なるデータソースを使用しているようです。")
    else:
        print("データが不足しているため判断できません。")

def test_api_comparison():
    """統合テスト用のエントリーポイント"""
    try:
        test_api_responses_direct()
        print("\n" + "=" * 80 + "\n")
        analyze_data_source()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    result = test_api_comparison()
    sys.exit(0 if result else 1)