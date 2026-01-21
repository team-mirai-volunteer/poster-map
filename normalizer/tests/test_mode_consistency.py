#!/usr/bin/env python3
"""
各モードの整合性を検証するテスト
"""

import sys
import os

# __file__を基点とした安定的なパス解決
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app'))

from geo_processor import get_best_latlng

def test_mode_consistency():
    """各モードでget_best_latlng関数が正しく動作するか検証"""
    
    test_address = "東京都中央区京橋1丁目19番13号先"
    test_cases = [
        {
            "name": "距離チェックモード",
            "params": {
                "mode": "distance",
                "gsi_check": True,
                "jageocoder_check": True,
                "reverse_geocode_check": False,
                "priority": "google"
            }
        },
        {
            "name": "逆引きチェックモード", 
            "params": {
                "mode": "reverse_geocode",
                "gsi_check": True,
                "jageocoder_check": True,
                "reverse_geocode_check": True,
                "priority": "gsi"
            }
        },
        {
            "name": "Googleのみモード",
            "params": {
                "mode": "google_only",
                "gsi_check": False,
                "jageocoder_check": False,
                "reverse_geocode_check": False,
                "priority": "google"
            }
        },
        {
            "name": "国土地理院のみモード",
            "params": {
                "mode": "gsi_only",
                "gsi_check": True,
                "jageocoder_check": False,
                "reverse_geocode_check": False,
                "priority": "gsi"
            }
        },
        {
            "name": "Jageocoderのみモード",
            "params": {
                "mode": "jageocoder_only",
                "gsi_check": False,
                "jageocoder_check": True,
                "reverse_geocode_check": False,
                "priority": "jageocoder"
            }
        }
    ]
    
    print("=== モード別整合性テスト ===\n")
    
    # APIキーとエンドポイントの確認
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        print("[注意] Google Maps APIキーが設定されていません。Googleモードはスキップされます。\n")
    
    # Jageocoderエンドポイントの確認
    from constants import API_ENDPOINTS
    jageocoder_available = bool(API_ENDPOINTS.get("jageocoder"))
    if not jageocoder_available:
        print("[注意] Jageocoderエンドポイントが設定されていません。Jageocoderモードはスキップされます。\n")
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"【{test_case['name']}】")
        
        # Google APIキーが必要なモードはスキップ
        if test_case['params']['mode'] in ['google_only', 'distance', 'reverse_geocode'] and not api_key:
            print("  [SKIP] Google APIキーが必要です\n")
            continue
        
        # Jageocoderエンドポイントが必要なモードはスキップ
        if test_case['params']['mode'] == 'jageocoder_only' and not jageocoder_available:
            print("  [SKIP] Jageocoderエンドポイントが必要です\n")
            continue
        
        try:
            params = test_case['params']
            lat, lon, source = get_best_latlng(
                index=1,
                address=test_address,
                api_key=api_key,
                gsi_check=params['gsi_check'],
                distance_threshold=200,
                priority=params['priority'],
                mode=params['mode'],
                reverse_geocode_check=params['reverse_geocode_check'],
                note_out=[],
                logger=None,
                jageocoder_check=params['jageocoder_check'],
                area="東京都"
            )
            
            if lat is not None and lon is not None:
                print(f"  [OK] 座標取得成功: {lat:.6f}, {lon:.6f}")
                print(f"  [OK] ソース: {source}")
                
                # モードとソースの整合性チェック
                if params['mode'] == 'google_only' and source != 'google':
                    print(f"  [NG] エラー: Googleのみモードなのに{source}が返された")
                    all_passed = False
                elif params['mode'] == 'gsi_only' and source != 'gsi':
                    print(f"  [NG] エラー: 国土地理院のみモードなのに{source}が返された")
                    all_passed = False
                elif params['mode'] == 'jageocoder_only' and source != 'jageocoder':
                    print(f"  [NG] エラー: Jageocoderのみモードなのに{source}が返された")
                    all_passed = False
                else:
                    print(f"  [OK] モードとソースの整合性: OK")
            else:
                print(f"  [NG] 座標取得失敗")
                all_passed = False
                
        except Exception as e:
            print(f"  [NG] エラー発生: {str(e)}")
            all_passed = False
        
        print()
    
    # パラメータ引き渡しの検証
    print("【パラメータ引き渡し検証】")
    try:
        # 6つの値が正しく返されるか
        from geo_processor import _get_coordinates_by_mode
        
        result = _get_coordinates_by_mode(
            address=test_address,
            api_key=api_key,
            mode="distance",
            gsi_check=True,
            jageocoder_check=True,
            area="東京都",
            priority="google"
        )
        
        # pytest用の明示的なアサーション
        assert len(result) == 6, f"_get_coordinates_by_mode should return 6 values, but returned {len(result)}"
        
        if len(result) == 6:
            print("  [OK] _get_coordinates_by_mode: 6つの値を正しく返す")
        else:
            print(f"  [NG] _get_coordinates_by_mode: {len(result)}個の値を返した（期待値: 6）")
            all_passed = False
            
    except Exception as e:
        print(f"  [NG] パラメータ引き渡しエラー: {str(e)}")
        all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("[SUCCESS] すべてのテストが成功しました")
    else:
        print("[FAILURE] 一部のテストが失敗しました")

    # pytest用の最終アサーション
    assert all_passed, "Some mode consistency tests failed"

if __name__ == "__main__":
    success = test_mode_consistency()
    sys.exit(0 if success else 1)