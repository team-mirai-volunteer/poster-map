#!/usr/bin/env python3
"""
Jageocoder APIのHTTPSエンドポイント可用性をテスト
"""

import requests
import sys

def test_https_availability():
    """HTTPSエンドポイントの可用性を確認"""
    
    print("=== Jageocoder HTTPS エンドポイント可用性テスト ===\n")
    
    # テストする住所
    test_address = "東京都中央区京橋1丁目19番13号"
    
    endpoints = [
        {
            "name": "HTTP (現在使用中)",
            "geocode": "http://jageocoder.tsuruharu.com/geocode",
            "reverse": "http://jageocoder.tsuruharu.com/rgeocode"
        },
        {
            "name": "HTTPS (テスト)",
            "geocode": "https://jageocoder.tsuruharu.com/geocode",
            "reverse": "https://jageocoder.tsuruharu.com/rgeocode"
        }
    ]
    
    for endpoint_set in endpoints:
        print(f"【{endpoint_set['name']}】")
        
        # 順方向ジオコーディングのテスト
        print(f"  順方向ジオコーディング: {endpoint_set['geocode']}")
        try:
            response = requests.get(
                endpoint_set['geocode'],
                params={"addr": test_address},
                timeout=10
            )
            print(f"    ステータスコード: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    print(f"    [OK] レスポンス取得成功")
                else:
                    print(f"    [NG] 空のレスポンス")
            else:
                print(f"    [NG] HTTPエラー")
        except requests.exceptions.SSLError as e:
            print(f"    [NG] SSL証明書エラー: {e}")
        except requests.exceptions.ConnectionError as e:
            print(f"    [NG] 接続エラー: {e}")
        except Exception as e:
            print(f"    [NG] その他のエラー: {e}")
        
        # 逆ジオコーディングのテスト
        print(f"  逆ジオコーディング: {endpoint_set['reverse']}")
        try:
            response = requests.get(
                endpoint_set['reverse'],
                params={"lat": 35.677975, "lon": 139.774460, "level": 7},
                timeout=10
            )
            print(f"    ステータスコード: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    print(f"    [OK] レスポンス取得成功")
                else:
                    print(f"    [NG] 空のレスポンス")
            else:
                print(f"    [NG] HTTPエラー")
        except requests.exceptions.SSLError as e:
            print(f"    [NG] SSL証明書エラー: {e}")
        except requests.exceptions.ConnectionError as e:
            print(f"    [NG] 接続エラー: {e}")
        except Exception as e:
            print(f"    [NG] その他のエラー: {e}")
        
        print()
    
    print("【結論】")
    print("HTTPSエンドポイントが利用可能な場合は、constants.pyのAPI_ENDPOINTSを更新してください。")
    print("現状はHTTPエンドポイントを使用しています。")

def test_https_endpoints():
    """統合テスト用のエントリーポイント"""
    try:
        test_https_availability()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    result = test_https_endpoints()
    sys.exit(0 if result else 1)