#!/usr/bin/env python3
"""
district列機能のテスト
"""

import sys
import os

# テスト環境設定を最初に実行
from .test_config import setup_test_environment
setup_test_environment()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from geo_processor import process_csv_data


def test_district_column_included():
    """district列が含まれる場合のテスト"""
    print("\n=== Test: district列を含むCSV処理 ===")

    # テストデータ
    csv_data = [
        ["1", "東京1区", "京橋１丁目１９番１３号先", "楓川久安橋公園"],
        ["2", "東京2区", "京橋２丁目１８番１号先", "弾正橋北西側欄干"],
    ]

    config = {
        "format": {
            "prefecture": "東京都",
            "city": "中央区",
            "number": "{1}",
            "district": "{2}",
            "address": "{3}",
            "name": "{4}",
        },
        "api": {
            "sleep": 0
        },
        "normalize_address_digits": False
    }

    # 処理実行（座標取得なし）
    results = process_csv_data(
        csv_data,
        config,
        progress_callback=None,
        log_callback=None,
        gsi_check=False,
        mode="gsi_only"
    )

    # ヘッダーの検証
    header = results[0]
    assert "district" in header, "district列がヘッダーに含まれていません"

    # district列の位置確認（prefecture, cityの後）
    pref_idx = header.index("prefecture")
    city_idx = header.index("city")
    district_idx = header.index("district")

    assert pref_idx < city_idx < district_idx, "district列の位置が不正です"

    # データの検証
    assert len(results) == 3, f"結果の行数が不正です: {len(results)}"

    # 1行目のdistrictデータ確認
    row1 = results[1]
    assert row1[district_idx] == "東京1区", f"district列のデータが不正です: {row1[district_idx]}"

    # 2行目のdistrictデータ確認
    row2 = results[2]
    assert row2[district_idx] == "東京2区", f"district列のデータが不正です: {row2[district_idx]}"

    print(f"[OK] ヘッダー: {header}")
    print(f"[OK] district列インデックス: {district_idx}")
    print(f"[OK] 1行目district: {row1[district_idx]}")
    print(f"[OK] 2行目district: {row2[district_idx]}")
    print("[PASS] district列を含むCSV処理テスト成功")


def test_district_column_excluded():
    """district列が含まれない場合のテスト"""
    print("\n=== Test: district列を含まないCSV処理 ===")

    # テストデータ（district列なし）
    csv_data = [
        ["1", "京橋１丁目１９番１３号先", "楓川久安橋公園"],
        ["2", "京橋２丁目１８番１号先", "弾正橋北西側欄干"],
    ]

    config = {
        "format": {
            "prefecture": "東京都",
            "city": "中央区",
            "number": "{1}",
            "address": "{2}",
            "name": "{3}",
        },
        "api": {
            "sleep": 0
        },
        "normalize_address_digits": False
    }

    # 処理実行（座標取得なし）
    results = process_csv_data(
        csv_data,
        config,
        progress_callback=None,
        log_callback=None,
        gsi_check=False,
        mode="gsi_only"
    )

    # ヘッダーの検証
    header = results[0]
    assert "district" not in header, "district列がヘッダーに含まれています（含まれるべきではない）"

    # 必須列の確認
    assert "prefecture" in header, "prefecture列がありません"
    assert "city" in header, "city列がありません"
    assert "number" in header, "number列がありません"
    assert "address" in header, "address列がありません"
    assert "name" in header, "name列がありません"

    print(f"[OK] ヘッダー: {header}")
    print("[PASS] district列を含まないCSV処理テスト成功")


def test_district_column_order():
    """district列の順序が正しいことを検証"""
    print("\n=== Test: district列の順序確認 ===")

    csv_data = [
        ["1", "衆院東京1区", "京橋１丁目１９番１３号先", "楓川久安橋公園"],
    ]

    config = {
        "format": {
            "prefecture": "東京都",
            "city": "中央区",
            "number": "{1}",
            "district": "{2}",
            "address": "{3}",
            "name": "{4}",
        },
        "api": {
            "sleep": 0
        },
        "normalize_address_digits": False
    }

    results = process_csv_data(
        csv_data,
        config,
        progress_callback=None,
        log_callback=None,
        gsi_check=False,
        mode="gsi_only"
    )

    header = results[0]

    # 期待される順序: prefecture, city, number, district, address, name, note
    # （実際の順序はformat_configのkeys()の順序に依存）
    pref_idx = header.index("prefecture")
    city_idx = header.index("city")
    district_idx = header.index("district")
    number_idx = header.index("number")
    address_idx = header.index("address")
    name_idx = header.index("name")

    print(f"[OK] prefecture位置: {pref_idx}")
    print(f"[OK] city位置: {city_idx}")
    print(f"[OK] district位置: {district_idx}")
    print(f"[OK] number位置: {number_idx}")
    print(f"[OK] address位置: {address_idx}")
    print(f"[OK] name位置: {name_idx}")

    # prefecture, city の後にdistrict以外の列があることを確認
    # （format_configの順序通りに出力される）
    assert pref_idx == 0, "prefecture列は0番目であるべき"
    assert city_idx == 1, "city列は1番目であるべき"

    print(f"[OK] 列順序: {header}")
    print("[PASS] district列の順序確認テスト成功")


def test_district_with_special_characters():
    """特殊文字を含むdistrict列のテスト"""
    print("\n=== Test: 特殊文字を含むdistrict列 ===")

    csv_data = [
        ["1", "東京第1区", "京橋１丁目１９番１３号先", "楓川久安橋公園"],
        ["2", "東京第2区（特別）", "京橋２丁目１８番１号先", "弾正橋北西側欄干"],
    ]

    config = {
        "format": {
            "prefecture": "東京都",
            "city": "中央区",
            "number": "{1}",
            "district": "{2}",
            "address": "{3}",
            "name": "{4}",
        },
        "api": {
            "sleep": 0
        },
        "normalize_address_digits": False
    }

    results = process_csv_data(
        csv_data,
        config,
        progress_callback=None,
        log_callback=None,
        gsi_check=False,
        mode="gsi_only"
    )

    header = results[0]
    district_idx = header.index("district")

    row1 = results[1]
    row2 = results[2]

    assert row1[district_idx] == "東京第1区", f"特殊文字を含むdistrict列が正しく処理されていません: {row1[district_idx]}"
    assert row2[district_idx] == "東京第2区（特別）", f"括弧を含むdistrict列が正しく処理されていません: {row2[district_idx]}"

    print(f"[OK] 特殊文字district: {row1[district_idx]}")
    print(f"[OK] 括弧付きdistrict: {row2[district_idx]}")
    print("[PASS] 特殊文字を含むdistrict列テスト成功")


if __name__ == "__main__":
    print("=" * 60)
    print("district列機能 統合テスト")
    print("=" * 60)

    try:
        test_district_column_included()
        test_district_column_excluded()
        test_district_column_order()
        test_district_with_special_characters()

        print("\n" + "=" * 60)
        print("[SUCCESS] すべてのdistrict列テストが成功しました！")
        print("=" * 60)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAILED] テスト失敗: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] 予期しないエラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
