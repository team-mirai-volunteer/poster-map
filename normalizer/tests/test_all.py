#!/usr/bin/env python3
"""
すべてのテストを実行する統合テストスクリプト
"""

import sys
import os

# appディレクトリをパスに追加
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

def run_all_tests():
    """すべてのテストを実行"""
    print("=" * 60)
    print("CSV正規化ツール 統合テスト")
    print("=" * 60)
    
    all_passed = True
    
    # 1. 住所重複削除テスト
    print("\n[1/3] 住所重複削除テスト")
    print("-" * 40)
    from test_integration import test_integration_duplicate_removal
    test1_passed = test_integration_duplicate_removal()
    all_passed = all_passed and test1_passed
    
    # 2. 逆ジオコーディングテスト
    print("\n[2/3] 逆ジオコーディングテスト")
    print("-" * 40)
    from test_reverse_geocoding import test_reverse_geocoding_validation
    test2_passed = test_reverse_geocoding_validation()
    all_passed = all_passed and test2_passed
    
    # 3. Jageocoder APIテスト
    print("\n[3/3] Jageocoder APIテスト")
    print("-" * 40)
    from test_jageocoder import main as test_jageocoder_main
    test3_result = test_jageocoder_main()
    test3_passed = (test3_result == 0)
    all_passed = all_passed and test3_passed
    
    # 結果のサマリー
    print("\n" + "=" * 60)
    print("テスト結果サマリー")
    print("=" * 60)
    print(f"住所重複削除テスト: {'[PASS]' if test1_passed else '[FAIL]'}")
    print(f"逆ジオコーディングテスト: {'[PASS]' if test2_passed else '[FAIL]'}")
    print(f"Jageocoder APIテスト: {'[PASS]' if test3_passed else '[FAIL]'}")
    print("-" * 60)
    
    if all_passed:
        print("[SUCCESS] すべてのテストが成功しました！")
        return 0
    else:
        print("[FAILED] 一部のテストが失敗しました")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())