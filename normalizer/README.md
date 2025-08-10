# CSV正規化ツール

自治体が提供するポスター掲示場情報のCSVを正規化し、複数のジオコーディングAPIを使って緯度経度を付与するWebアプリケーションです。

## 🚀 機能概要

- **Streamlit Webインターフェース**: 直感的なCSVアップロードと設定画面
- **複数API対応**: Google Maps、国土地理院、Jageocoderの3つのジオコーディングAPI統合
- **柔軟な検証モード**: 5つの座標品質検証モードから選択可能
- **座標品質チェック**: 複数APIでの距離比較や逆ジオコーディング検証
- **自動列認識**: CSVの列名（number, address, name）を自動でマッピング
- **柔軟な列マッピング**: CSVの列構成に合わせて設定可能
- **漢数字変換**: 住所の漢数字をアラビア数字に変換（オプション）
- **バリデーション機能**: 不適切な設定での実行を防止
- **Docker対応**: コンテナ化による簡単なデプロイメント
- **Cloud Run対応**: Google Cloud Runでの本番運用

## 📦 ディレクトリ構成

```
normalizer/
├── app/
│   ├── streamlit_app.py      # メインのStreamlitアプリケーション
│   ├── geo_processor.py      # CSV処理とGeocoding機能
│   ├── config_manager.py     # 設定管理
│   └── constants.py          # API定数とエンドポイント管理
├── tests/                   # テストコード
│   ├── test_all.py          # 統合テスト実行
│   ├── test_integration.py  # 統合テスト
│   ├── test_jageocoder.py   # Jageocoder APIテスト
│   ├── test_reverse_geocoding.py  # 逆ジオコーディングテスト
│   ├── test_api_comparison.py     # API比較テスト
│   └── test_https_endpoint.py     # HTTPSエンドポイントテスト
├── sample/                   # サンプルデータ
├── Dockerfile               # Docker設定
├── Makefile                # デプロイメント用コマンド
├── requirements.txt        # Python依存関係
├── .env.example           # 環境変数テンプレート
├── CLAUDE.md              # Claudeへの開発指示
└── README.md              # このファイル
```

## 🛠️ ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
cd normalizer
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集してGoogle Maps APIキーを設定（Google APIを使用する場合のみ）
```

### 3. アプリケーションの起動

```bash
streamlit run app/streamlit_app.py
```

アプリケーションは [http://localhost:8501](http://localhost:8501) でアクセス可能になります。

### 4. テストの実行

```bash
# 全テストを実行
cd tests
python test_all.py

# または個別テスト
python test_integration.py          # 統合テスト
python test_jageocoder.py          # Jageocoder APIテスト
python test_reverse_geocoding.py   # 逆ジオコーディングテスト
python test_api_comparison.py      # API比較テスト
python test_https_endpoint.py      # HTTPSエンドポイントテスト
```

## 🐳 Docker での実行

### ローカルでのビルドと実行

```bash
# Dockerイメージのビルド
make build

# ローカルでの実行（Google APIを使用する場合）
GOOGLE_MAPS_API_KEY="your_api_key_here" make run-local

# テスト用コンテナ起動（APIキー不要）
make test-local
```

## ☁️ Google Cloud Run へのデプロイ

### 前提条件

- Google Cloud SDKがインストールされていること
- Google Cloud プロジェクトが設定されていること
- Geocoding APIが有効になっていること（Google APIを使用する場合）

### 1. シークレットの設定

```bash
make setup-secrets
```

### 2. デプロイの実行

```bash
make deploy
```

### 3. 必要な権限の設定

Cloud Runサービスアカウントに以下の権限が必要です：

```bash
# Secret Managerへのアクセス権限
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
```

## 📄 使用方法

### 1. CSVファイルの準備

以下の形式のCSVファイルを準備してください。列名の自動認識機能により、設定作業が簡素化されます：

#### **推奨形式（自動認識対応）**
```csv
number,address,name
1,京橋１丁目１９番１３号先,楓川久安橋公園
2,京橋２丁目１８番１号先,弾正橋北西側欄干
```

#### **日本語列名（自動認識対応）**
```csv
番号,住所,名称
1,京橋１丁目１９番１３号先,楓川久安橋公園
2,京橋２丁目１８番１号先,弾正橋北西側欄干
```

#### **その他の形式**
```csv
掲示場No,所在地,施設名
1,京橋１丁目１９番１３号先,楓川久安橋公園
2,京橋２丁目１８番１号先,弾正橋北西側欄干
```

### 2. Webアプリケーションでの処理

1. **CSVファイルをアップロード**: 処理したいCSVファイルを選択
   - 列名が「number」「address」「name」の場合、自動的にマッピング
   - 日本語列名（番号、住所、名称など）も自動認識

2. **検証モードを選択**: 5つの座標品質検証モードから選択
   - **距離チェック**: 複数APIの結果を比較して品質検証（要：追加API選択）
   - **逆引きチェック**: 逆ジオコーディングで住所検証（APIを個別選択可）
   - **Googleのみ**: Google Maps APIのみ使用（APIキー必要）
   - **国土地理院のみ**: 国土地理院APIのみ使用（APIキー不要）
   - **Jageocoderのみ**: Jageocoder APIのみ使用（APIキー不要）

3. **都道府県・市区町村を設定**: 自動推定も利用可能

4. **列マッピングを確認・調整**: 自動認識された列マッピングを確認
   - 必要に応じて手動で調整

5. **APIキーを入力**: Google APIを使用する場合のみ必要

6. **処理を実行**: 選択したモードで座標取得・検証を実行
   - 距離チェックモードでは追加APIの選択が必須
   - 逆引きチェックモードでは使用するAPIの選択が必須

7. **正規化済みCSVをダウンロード**: 処理結果をダウンロード

### 3. 出力形式

処理後のCSVは以下の形式で出力されます：

```csv
prefecture,city,number,address,name,lat,long
東京都,中央区,1-1,京橋１丁目１９番１３号先,楓川久安橋公園,35.677349,139.7740739
東京都,中央区,1-2,京橋２丁目１８番１号先,弾正橋北西側欄干,35.6752085,139.7727527
```

## ⚙️ 設定オプション

### 利用可能なジオコーディングAPI

本ツールは3つのジオコーディングAPIをサポートしています：

1. **Google Maps Geocoding API**
   - 高精度で詳細な住所情報を提供
   - APIキーが必要（有料）
   - 建物名や施設名も含む詳細な結果

2. **国土地理院API**
   - 無料で利用可能
   - APIキー不要
   - 日本国内の住所に特化

3. **Jageocoder API** 
   - 無料で利用可能
   - APIキー不要
   - 高速なレスポンス
   - **注意**: 国土地理院と同じデータソースを使用している可能性があり、両APIの結果がほぼ一致することがあります

### 検証モード

1. **距離チェックモード**: 
   - 複数API（Google、国土地理院、Jageocoder）の結果を比較
   - 座標間の距離が閾値（デフォルト200m）を超える場合に警告
   - 優先するAPIを設定可能
   - 使用するAPIを個別に選択可能

2. **逆引きチェックモード**: 
   - 取得した座標を逆ジオコーディングで検証
   - 「Google APIを使う」「Jageocoder APIを使う」のチェックボックスで使用APIを選択
   - 少なくとも1つのAPIを選択する必要あり
   - 元の住所と逆引き結果の住所を比較
   - 全ての逆引きが不一致時は、プルダウンで選択したAPIの座標を採用
   - 優先APIの座標が取得できない場合、他APIの座標を優先APIの座標として扱う

3. **Google単独モード**: 
   - Google Maps Geocoding APIのみ使用
   - APIキー必要、高精度

4. **国土地理院単独モード**: 
   - 国土地理院APIのみ使用
   - APIキー不要、無料利用可能

5. **Jageocoder単独モード**: 
   - Jageocoder APIのみ使用
   - APIキー不要、高速レスポンス

### APIコール間隔

APIの利用制限を避けるため、APIコール間の待機時間を設定できます（デフォルト: 200ms）。

### 漢数字変換

住所に含まれる漢数字（二丁目、三番など）をアラビア数字（2丁目、3番）に変換するオプションがあります。

## 🔒 セキュリティ

- **APIキーの管理**: 本番環境では環境変数またはSecret Managerを使用
- **アクセス制御**: Cloud Runでの認証設定が可能
- **ログ管理**: 機密情報がログに出力されないよう配慮

## 📌 注意事項

### API利用について
- **Google Maps Geocoding API**: 課金対象です。使用量制限の設定を推奨します
- **国土地理院API**: 無料利用可能ですが、商用利用時は利用規約を確認してください
- **Jageocoder API**: 無料利用可能、APIキー不要、HTTPSで安全

### パフォーマンス
- 大量データ処理時は、APIコール間隔を適切に設定してください（デフォルト200ms）
- 処理中はブラウザを閉じないでください
- 逆引きチェックモードでは複数のAPI呼び出しが発生するため、処理時間が長くなります

### データソースについて
- **Jageocoder APIと国土地理院APIについて**: テスト結果から、両APIは同じまたは非常に類似したデータソースを使用している可能性があります
- 両方を同時に使用する場合、結果がほぼ一致することが多いため、バックアップ用途としての利用を推奨します
- 座標の精度比較が目的の場合は、GoogleとJageocoder（または国土地理院）の組み合わせを推奨します

### 設定制限
- **距離チェックモード**: 「国土地理院APIを使う」または「Jageocoder APIを使う」の少なくとも一方にチェックが必要です
- **逆引きチェックモード**: 
  - 「Google APIを使う」または「Jageocoder APIを使う」の少なくとも一方にチェックが必要です
  - チェックされていないAPIは呼び出されません（パフォーマンス向上）
  - 「逆引き不一致時に採用するAPI」では、Google、国土地理院、Jageocoderから選択可能

## 🛠️ トラブルシューティング

### よくある問題

1. **APIキーエラー**: 
   - Google Maps Geocoding APIが有効になっているか確認
   - APIキーの制限設定（リファラー、IPアドレス）を確認
   
2. **権限エラー**: 
   - Cloud RunサービスアカウントにSecret Manager権限があるか確認
   
3. **メモリエラー**: 
   - 大量データ処理時はCloud Runのメモリ設定を増加
   
4. **座標取得エラー**:
   - 住所が正確か確認（都道府県、市区町村の設定含む）
   - APIコール間隔を長めに設定（500-1000ms）
   - 単独モード（国土地理院またはJageocoder）での動作確認

5. **テスト失敗**:
   - インターネット接続を確認
   - APIサーバーの稼働状況を確認
   - Windowsの場合、文字エンコーディング問題の可能性

6. **ボタンが無効化される**:
   - 距離チェックモードで「国土地理院APIを使う」「Jageocoder APIを使う」が両方とも未選択
   - 逆引きチェックモードで「Google APIを使う」「Jageocoder APIを使う」が両方とも未選択
   - 警告メッセージに従って、少なくとも一方のAPIを選択してください

7. **列マッピングが正しく認識されない**:
   - CSVの列名を「number」「address」「name」に変更すると自動認識されます
   - 手動でプルダウンメニューから適切な列を選択してください

### ログの確認

```bash
# Cloud Runのログを確認
gcloud logs read --service=csv-normalizer --limit=50
```

## 📜 ライセンス

このプロジェクトは[GPL-3.0 license](https://github.com/team-mirai-volunteer/poster-map/blob/main/LICENSE)の下で公開されています。

## 📝 更新履歴

### v2.1.0
- **逆引きチェックモード大幅改善**: 
  - Google APIとJageocoder APIの個別選択をサポート
  - 選択されていないAPIは呼び出さない最適化
  - 優先APIの座標が取得できない場合の自動フォールバック機能
- **UIバリデーション強化**: 逆引きチェックモードでもAPI選択を必須化
- **パフォーマンス向上**: 不要なAPI呼び出しを削減

### v2.0.0
- **Jageocoder API統合**: 3つ目のジオコーディングAPIを追加
- **逆引きチェックモード改善**: Jageocoderでの逆引き検証をサポート
- **自動列認識機能**: CSVの列名（number, address, name）を自動でマッピング
- **バリデーション機能**: 距離チェックモードでのAPI選択必須化
- **コードリファクタリング**: 関数分離、定数管理、エラーハンドリング改善
- **HTTPSセキュリティ**: 全APIエンドポイントのHTTPS対応
- **テスト充実化**: 統合テスト、API比較テスト、整合性テストを追加

### v1.0.0
- **基本機能**: Google Maps APIと国土地理院APIによる座標取得
- **距離チェック**: 複数APIの結果比較による品質検証
- **Streamlit UI**: Webベースのインターフェース実装
