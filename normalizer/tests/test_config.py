#!/usr/bin/env python3
"""
テスト共通設定モジュール
すべてのテストで使用する環境変数やユーティリティ関数を提供
"""

import os

def setup_test_environment():
    """
    テスト環境を設定する
    Jageocoderエンドポイントは環境変数が明示的に設定された場合のみ有効化
    """
    # Jageocoderエンドポイント設定（環境変数が設定されている場合のみ有効化）
    jageocoder_endpoint = os.environ.get("JAGEOCODER_ENDPOINT")
    
    if jageocoder_endpoint:
        print(f"[INFO] Jageocoderエンドポイントを有効化: {jageocoder_endpoint}")
    else:
        # 環境変数が未設定の場合は無効化
        os.environ.setdefault("JAGEOCODER_ENDPOINT", "")
        print("[INFO] JAGEOCODER_ENDPOINTが未設定のため、Jageocoderエンドポイントを無効化")
    
    # その他のテスト用設定
    os.environ.setdefault("API_TIMEOUT", "10")
    os.environ.setdefault("DEFAULT_DISTANCE_THRESHOLD", "200")
    os.environ.setdefault("DEFAULT_SLEEP_MSEC", "50")  # テスト高速化のため短縮

def check_api_endpoints():
    """
    APIエンドポイントの有効性をチェック
    
    Returns:
        dict: 各APIエンドポイントの有効性
    """
    from constants import API_ENDPOINTS
    
    return {
        "jageocoder": bool(API_ENDPOINTS.get("jageocoder")),
        "jageocoder_reverse": bool(API_ENDPOINTS.get("jageocoder_reverse")),
        "google": bool(API_ENDPOINTS.get("google")),
        "gsi": bool(API_ENDPOINTS.get("gsi"))
    }

def skip_if_endpoint_disabled(endpoint_name):
    """
    指定されたエンドポイントが無効な場合、テストをスキップする
    
    Args:
        endpoint_name (str): チェックするエンドポイント名
        
    Returns:
        bool: True if test should continue, False if skip
    """
    endpoint_status = check_api_endpoints()
    
    if not endpoint_status.get(endpoint_name, False):
        print(f"[SKIP] {endpoint_name} エンドポイントが無効化されています。")
        if endpoint_name.startswith("jageocoder"):
            print("環境変数 JAGEOCODER_ENDPOINT を設定してください。")
        else:
            print(f"環境変数で {endpoint_name.upper()}_ENDPOINT を設定してください。")
        return False
    
    return True

def print_test_environment():
    """テスト環境の情報を表示"""
    from constants import API_ENDPOINTS
    
    print("=== Test Environment ===")
    for name, url in API_ENDPOINTS.items():
        status = "✓" if url else "✗"
        print(f"  {name}: {status} {url}")
    print("========================")