#!/usr/bin/env python3
"""
Test script for reverse geocoding functionality
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from geo_processor import (
    normalize_japanese_address, 
    addresses_roughly_match,
    remove_prefecture_duplication,
    remove_city_duplication,
    clean_address_duplicates
)

def test_normalize_japanese_address():
    print("=== Testing normalize_japanese_address ===")
    test_cases = [
        "東京都中央区銀座１丁目２番３号先",
        "中央区京橋１丁目１９番１３号先",
        "銀座８丁目１９番先"
    ]
    
    for addr in test_cases:
        normalized = normalize_japanese_address(addr)
        print(f"Original: {addr}")
        print(f"Normalized: {normalized}")
        print()

def test_addresses_roughly_match():
    print("=== Testing addresses_roughly_match ===")
    test_pairs = [
        ("中央区銀座１丁目２番", "東京都中央区銀座1丁目2番"),
        ("京橋１丁目１９番", "東京都中央区京橋1丁目19番"),
        ("銀座１丁目２番", "新宿区歌舞伎町1丁目1番")
    ]
    
    for addr1, addr2 in test_pairs:
        match = addresses_roughly_match(addr1, addr2)
        print(f"Address 1: {addr1}")
        print(f"Address 2: {addr2}")
        print(f"Match: {match}")
        print()

def test_duplicate_removal():
    print("=== Testing duplicate removal functions ===")
    
    test_cases_pref = [
        ("東京都", "東京都板橋区高島平1丁目", "板橋区高島平1丁目"),
        ("大阪府", "大阪府大阪市北区梅田", "大阪市北区梅田"),
        ("東京都", "板橋区高島平1丁目", "板橋区高島平1丁目"),  # No duplication
    ]
    
    for pref, addr, expected in test_cases_pref:
        result = remove_prefecture_duplication(pref, addr)
        print(f"Prefecture: {pref}, Address: {addr}")
        print(f"Expected: {expected}, Got: {result}")
        print(f"Match: {result == expected}")
        print()
    
    test_cases_city = [
        ("板橋区", "板橋区高島平1丁目", "高島平1丁目"),
        ("中央区", "中央区銀座1丁目", "銀座1丁目"),
        ("板橋区", "高島平1丁目", "高島平1丁目"),  # No duplication
    ]
    
    for city, addr, expected in test_cases_city:
        result = remove_city_duplication(city, addr)
        print(f"City: {city}, Address: {addr}")
        print(f"Expected: {expected}, Got: {result}")
        print(f"Match: {result == expected}")
        print()
    
    test_cases_combined = [
        ("東京都", "板橋区", "板橋区高島平1丁目", "高島平1丁目"),
        ("東京都", "板橋区", "東京都板橋区高島平1丁目", "高島平1丁目"),
        ("東京都", "中央区", "銀座1丁目", "銀座1丁目"),  # No duplication
    ]
    
    for pref, city, addr, expected in test_cases_combined:
        result = clean_address_duplicates(pref, city, addr)
        print(f"Prefecture: {pref}, City: {city}, Address: {addr}")
        print(f"Expected: {expected}, Got: {result}")
        print(f"Match: {result == expected}")
        print()

def test_reverse_geocoding_validation():
    """逆ジオコーディング検証テストのエントリポイント"""
    try:
        test_normalize_japanese_address()
        test_addresses_roughly_match()
        test_duplicate_removal()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing reverse geocoding functions...")
    success = test_reverse_geocoding_validation()
    print("Test completed!" if success else "Test failed!")
    sys.exit(0 if success else 1)
