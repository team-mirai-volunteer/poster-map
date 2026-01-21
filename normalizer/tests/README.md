# テストモジュール

CSV正規化ツールのテストコード集です。

## テストファイル

### 1. test_integration.py
- 住所の重複削除機能のテスト
- 都道府県・市区町村名が住所に含まれている場合の処理を検証

### 2. test_reverse_geocoding.py
- 逆ジオコーディング機能のテスト
- 住所の正規化と一致判定のテスト
- Google Maps APIを使用した逆引き検証

### 3. test_jageocoder.py
- Jageocoder APIの統合テスト
- 順方向ジオコーディング（住所→座標）
- 逆方向ジオコーディング（座標→住所）
- 3つのAPI（Google、国土地理院、Jageocoder）の比較

### 4. test_all.py
- すべてのテストを実行する統合スクリプト

## テストの実行方法

### 個別テストの実行
```bash
# testsディレクトリから実行
cd tests

# 住所重複削除テスト
python test_integration.py

# 逆ジオコーディングテスト
python test_reverse_geocoding.py

# Jageocoder APIテスト
python test_jageocoder.py
```

### すべてのテストを実行
```bash
# testsディレクトリから
python test_all.py

# または親ディレクトリから
python tests/test_all.py
```

## 環境変数

一部のテストはGoogle Maps APIキーが必要です：
```bash
export GOOGLE_MAPS_API_KEY="your_api_key_here"
```

APIキーがない場合でも、国土地理院APIとJageocoder APIのテストは実行可能です。

## テスト結果の見方

- `[OK]` / `[PASS]` / `[SUCCESS]`: テスト成功
- `[NG]` / `[FAIL]` / `[FAILED]`: テスト失敗
- `[SKIP]`: 環境設定の不足等でスキップ

## 注意事項

- テストはAPIを実際に呼び出すため、ネットワーク接続が必要です
- APIレート制限に注意してください
- テスト実行時は`app`ディレクトリへのパスが自動的に設定されます