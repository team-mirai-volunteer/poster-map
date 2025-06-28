#!/usr/bin/env python3

import sys
import os
sys.path.append('app')

from geo_processor import clean_address_duplicates

def test_integration_duplicate_removal():
    """
    Integration test to verify duplicate removal works with real sample data scenarios
    """
    print("=== Integration Test: Duplicate Removal ===")
    
    test_cases = [
        {
            "prefecture": "東京都",
            "city": "中央区", 
            "address": "京橋１丁目１９番１３号先",
            "expected": "京橋１丁目１９番１３号先",
            "description": "Normal address without duplication"
        },
        {
            "prefecture": "東京都",
            "city": "中央区",
            "address": "中央区京橋１丁目１９番１３号先", 
            "expected": "京橋１丁目１９番１３号先",
            "description": "Address with city duplication"
        },
        {
            "prefecture": "東京都",
            "city": "中央区",
            "address": "東京都京橋１丁目１９番１３号先",
            "expected": "京橋１丁目１９番１３号先", 
            "description": "Address with prefecture duplication"
        },
        {
            "prefecture": "東京都",
            "city": "中央区",
            "address": "東京都中央区京橋１丁目１９番１３号先",
            "expected": "京橋１丁目１９番１３号先",
            "description": "Address with both prefecture and city duplication"
        }
    ]
    
    all_passed = True
    
    for i, case in enumerate(test_cases, 1):
        result = clean_address_duplicates(
            case["prefecture"], 
            case["city"], 
            case["address"]
        )
        
        passed = result == case["expected"]
        all_passed = all_passed and passed
        
        print(f"Test Case {i}: {case['description']}")
        print(f"  Prefecture: {case['prefecture']}")
        print(f"  City: {case['city']}")
        print(f"  Input Address: {case['address']}")
        print(f"  Expected: {case['expected']}")
        print(f"  Got: {result}")
        print(f"  Result: {'✅ PASS' if passed else '❌ FAIL'}")
        print()
    
    print(f"Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    return all_passed

if __name__ == "__main__":
    success = test_integration_duplicate_removal()
    sys.exit(0 if success else 1)
