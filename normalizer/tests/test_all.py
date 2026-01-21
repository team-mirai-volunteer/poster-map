#!/usr/bin/env python3
"""
すべてのテストを実行する統合テストスクリプト
"""

import sys
import os

# テスト環境設定を最初に実行
from tests.test_config import setup_test_environment, print_test_environment
setup_test_environment()

# appディレクトリをパスに追加
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

def run_all_tests():
    """すべてのテストを実行"""
    print("=" * 60)
    print("CSV正規化ツール 統合テスト")
    print("すべての利用可能なテストファイルを実行します")
    print("=" * 60)
    
    all_passed = True
    test_results = {}
    
    # 1. 住所重複削除テスト
    print("\n[1/6] 住所重複削除テスト")
    print("-" * 40)
    try:
        from test_integration import test_integration_duplicate_removal
        test1_passed = test_integration_duplicate_removal()
        test_results["住所重複削除テスト"] = test1_passed
    except Exception as e:
        print(f"エラー: {e}")
        test1_passed = False
        test_results["住所重複削除テスト"] = False
    all_passed = all_passed and test1_passed
    
    # 2. 逆ジオコーディングテスト
    print("\n[2/6] 逆ジオコーディングテスト")
    print("-" * 40)
    try:
        from test_reverse_geocoding import test_reverse_geocoding_validation
        test2_passed = test_reverse_geocoding_validation()
        test_results["逆ジオコーディングテスト"] = test2_passed
    except Exception as e:
        print(f"エラー: {e}")
        test2_passed = False
        test_results["逆ジオコーディングテスト"] = False
    all_passed = all_passed and test2_passed
    
    # 3. Jageocoder APIテスト
    print("\n[3/6] Jageocoder APIテスト")
    print("-" * 40)
    try:
        from constants import API_ENDPOINTS
        if not API_ENDPOINTS.get("jageocoder") or not API_ENDPOINTS.get("jageocoder_reverse"):
            print("[SKIP] Jageocoderエンドポイントが設定されていないため、テストをスキップします。")
            test3_passed = True  # スキップは成功として扱う
            test_results["Jageocoder APIテスト"] = "SKIP"
        else:
            from test_jageocoder import main as test_jageocoder_main
            test3_result = test_jageocoder_main()
            test3_passed = (test3_result == 0)
            test_results["Jageocoder APIテスト"] = test3_passed
    except Exception as e:
        print(f"エラー: {e}")
        test3_passed = False
        test_results["Jageocoder APIテスト"] = False
    all_passed = all_passed and test3_passed
    
    # 4. API比較テスト
    print("\n[4/6] API比較テスト")
    print("-" * 40)
    try:
        from constants import API_ENDPOINTS
        if not API_ENDPOINTS.get("jageocoder"):
            print("[SKIP] Jageocoderエンドポイントが設定されていないため、API比較テストをスキップします。")
            test4_passed = True  # スキップは成功として扱う
            test_results["API比較テスト"] = "SKIP"
        else:
            from test_api_comparison import test_api_comparison
            test4_passed = test_api_comparison()
            test_results["API比較テスト"] = test4_passed
    except Exception as e:
        print(f"エラー: {e}")
        test4_passed = False
        test_results["API比較テスト"] = False
    all_passed = all_passed and test4_passed
    
    # 5. HTTPSエンドポイントテスト
    print("\n[5/6] HTTPSエンドポイントテスト")
    print("-" * 40)
    try:
        from constants import API_ENDPOINTS
        if not API_ENDPOINTS.get("jageocoder"):
            print("[SKIP] Jageocoderエンドポイントが設定されていないため、HTTPSテストをスキップします。")
            test5_passed = True  # スキップは成功として扱う
            test_results["HTTPSエンドポイントテスト"] = "SKIP"
        else:
            from test_https_endpoint import test_https_endpoints
            test5_passed = test_https_endpoints()
            test_results["HTTPSエンドポイントテスト"] = test5_passed
    except Exception as e:
        print(f"エラー: {e}")
        test5_passed = False
        test_results["HTTPSエンドポイントテスト"] = False
    all_passed = all_passed and test5_passed
    
    # 6. モード一貫性テスト
    print("\n[6/6] モード一貫性テスト")
    print("-" * 40)
    try:
        from test_mode_consistency import test_mode_consistency
        test6_passed = test_mode_consistency()
        test_results["モード一貫性テスト"] = test6_passed
    except Exception as e:
        print(f"エラー: {e}")
        test6_passed = False
        test_results["モード一貫性テスト"] = False
    all_passed = all_passed and test6_passed
    
    # 結果のサマリー
    print("\n" + "=" * 60)
    print("テスト結果サマリー")
    print("=" * 60)
    for test_name, result in test_results.items():
        if result == "SKIP":
            print(f"{test_name}: [SKIP]")
        elif result == True:
            print(f"{test_name}: [PASS]")
        else:
            print(f"{test_name}: [FAIL]")
    print("-" * 60)
    
    # pytest用の最終アサーション
    assert all_passed, f"Some tests failed. Results: {test_results}"
    
    if all_passed:
        print("[SUCCESS] すべてのテストが成功しました！")
        return 0
    else:
        print("[FAILED] 一部のテストが失敗しました")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())