# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ポスター掲示場情報CSV正規化ツール - 自治体が提供するCSVデータを正規化し、Google Maps APIを使用して座標情報を付与するStreamlitベースのWebアプリケーション。

## アーキテクチャ

### コア構成
- **Streamlitアプリケーション** (`app/streamlit_app.py`): WebUIとワークフロー制御
- **ジオコーディング処理** (`app/geo_processor.py`): 座標取得・検証ロジック
  - Google Maps Geocoding API統合
  - 国土地理院API統合（オプション）
  - Jageocoder API統合（オプション）
  - 住所正規化（漢数字変換、重複除去）
  - 座標検証（距離チェック、逆ジオコーディング）
- **設定管理** (`app/config_manager.py`): 設定保存・読み込み

### 座標取得モード
1. **距離チェックモード**: 複数のAPI（Google、国土地理院、Jageocoder）の結果を比較し、閾値以内であれば信頼
2. **逆引きチェックモード**: 取得した座標から逆ジオコーディングで住所を検証
3. **Googleのみモード**: Google Maps APIのみで処理
4. **国土地理院のみモード**: 国土地理院APIのみで処理（APIキー不要）
5. **Jageocoderのみモード**: Jageocoder APIのみで処理（APIキー不要）

## 開発コマンド

### ローカル開発
```bash
# 依存関係インストール
pip install -r requirements.txt

# Streamlitアプリ起動
streamlit run app/streamlit_app.py

# テスト実行（pytestを使用、推奨）
python -m pytest                    # すべてのテストを実行
python -m pytest -v                 # 詳細表示で実行
python -m pytest --collect-only     # テスト収集のみ（実行せず確認）

# 個別テストファイルの実行
python -m pytest tests/test_integration.py
python -m pytest tests/test_jageocoder.py
python -m pytest tests/test_reverse_geocoding.py
python -m pytest tests/test_api_comparison.py
python -m pytest tests/test_https_endpoint.py
python -m pytest tests/test_mode_consistency.py

# レガシー方式（従来の実行方法）
cd tests
python test_all.py  # 統合テストスクリプト
```

### Docker操作
```bash
# ビルド
make build

# ローカル実行（APIキー必要）
GOOGLE_MAPS_API_KEY="your_key" make run

# Linux用ビルド（macOSから）
make build-linux

# テスト用コンテナ起動
make test-local
```

### デプロイ
```bash
# Google Cloud Runへのデプロイ
make deploy

# コンテナレジストリへのプッシュ
make push
```

## 環境変数

### 実行時
- `GOOGLE_MAPS_API_KEY`: Google Maps Geocoding APIキー（Google API使用時は必須）
- `JAGEOCODER_ENDPOINT`: Jageocoder APIのベースURL（Jageocoder API使用時は必須）
  - 例: `https://jageocoder.tsuruharu.com`
  - システムが自動的に `/geocode` と `/rgeocode` パスを付加

### デプロイ時
- `PROJECT_ID`: GCPプロジェクトID
- `SA_NORMALIZER`: Cloud Runサービスアカウント

### テスト時（オプション）
- `API_TIMEOUT`: APIタイムアウト時間（デフォルト: 10秒）
- `DEFAULT_DISTANCE_THRESHOLD`: 距離閾値（デフォルト: 200m）
- `DEFAULT_SLEEP_MSEC`: APIコール間隔（デフォルト: 50ms、本番は200ms）

## データフロー

1. CSVアップロード → 列マッピング設定
2. 都道府県・市区町村の設定（自動推定あり）
3. 住所の正規化処理（漢数字変換、重複除去）
4. Google Maps APIで座標取得
5. 検証モードに応じた座標品質チェック
6. 正規化済みCSV出力（prefecture, city, number, address, name, lat, long）

## 重要な処理

### 住所正規化 (`geo_processor.py`)
- `normalize_address_digits()`: 漢数字をアラビア数字に変換
- `clean_address_duplicates()`: 都道府県・市区町村の重複除去
- `extract_address_like_text_from_last_row()`: 複数行データから住所抽出

### 座標取得と検証
- `get_gmap_latlng()`: Google Maps API呼び出し
- `get_gsi_latlng()`: 国土地理院API呼び出し
- `get_jageocoder_latlng()`: Jageocoder API呼び出し
- `reverse_geocode_google()`: 逆ジオコーディング検証
- `haversine()`: 座標間の距離計算

### APIレート制限対策
- 設定可能なスリープ時間（デフォルト200ms）
- タイムアウト処理（10秒）
- エラーハンドリング（クォータ超過、認証エラー）

## テストについて

### テスト構成
- **pytest**: テストフレームワークとして使用
- **14個のテスト関数**: 6つのテストファイルで構成
- **統合テスト**: `test_all.py` で全テストを統合実行可能

### テストファイル一覧
```
tests/
├── __init__.py                  # パッケージ初期化
├── test_config.py              # テスト共通設定（環境変数、ユーティリティ）
├── test_all.py                 # 統合テスト実行スクリプト
├── test_integration.py         # 住所重複削除の統合テスト
├── test_reverse_geocoding.py   # 住所正規化と逆ジオコーディング
├── test_jageocoder.py          # Jageocoder API機能テスト
├── test_api_comparison.py      # API結果比較テスト
├── test_https_endpoint.py      # HTTPSエンドポイント可用性テスト
└── test_mode_consistency.py    # モード整合性テスト
```

### テストのベストプラクティス
- **インポート**: 絶対インポート形式を使用 (`from tests.test_config import ...`)
- **アサーション**: `assert`文で検証、`return True/False`は使用しない
- **環境変数**: `test_config.py`で一元管理、テスト環境のセットアップを統一
- **スキップ処理**: エンドポイント未設定時は適切にスキップ（pytest警告なし）

### テスト実行の注意点
- **環境変数設定**: `.env`ファイルまたは環境変数で`JAGEOCODER_ENDPOINT`を設定
- **API依存テスト**: ネットワーク接続が必要なテストあり
- **実行時間**: 全テスト実行で約7-10秒（APIコール含む）

## Claude への指示

### 基本方針
- 日本語でのコミュニケーションを基本とする
- デグレ防止を最優先とし、既存機能に影響する変更は慎重に行う
- 「直して」と指示した部分だけ直すこと
- 「このバグを直して」のように指示したら、一切のデグレなくかつそのバグを直すこと

### ファイル編集
- ユーザーが手書きで編集したと思ったらそのファイルをリロードすること
- ユーザーが手書きで編集したと思しき個所は「ここはユーザーが編集されたようです」とその旨知らせて、勝手に編集しないこと

### テスト関連
- テスト関数は`assert`文で検証し、`return True/False`は使用しない（pytestベストプラクティス）
- テストのインポートは絶対インポート形式 (`from tests.test_config import ...`)
- テスト実行前に必ず`pytest`で動作確認すること
- テスト修正時は警告が出ないことを確認すること

### コーディング規約
- 環境変数は`test_config.py`または`constants.py`で一元管理
- ハードコードされたURLやエンドポイントは使用しない
- エラーハンドリングは明示的に行い、適切なメッセージを表示
