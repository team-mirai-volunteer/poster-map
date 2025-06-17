# CSV正規化ツール

自治体が提供するポスター掲示場情報のCSVを正規化し、Google Maps APIを使って緯度経度を付与するWebアプリケーションです。

## 🚀 機能概要

- **Streamlit Webインターフェース**: 直感的なCSVアップロードと設定画面
- **Google Maps API統合**: 住所から緯度経度を自動取得
- **柔軟な列マッピング**: CSVの列構成に合わせて設定可能
- **漢数字変換**: 住所の漢数字をアラビア数字に変換（オプション）
- **Docker対応**: コンテナ化による簡単なデプロイメント
- **Cloud Run対応**: Google Cloud Runでの本番運用

## 📦 ディレクトリ構成

```
normalizer/
├── app/
│   ├── streamlit_app.py      # メインのStreamlitアプリケーション
│   ├── geo_processor.py      # CSV処理とGeocoding機能
│   └── config_manager.py     # 設定管理
├── sample/                   # サンプルデータ
├── Dockerfile               # Docker設定
├── Makefile                # デプロイメント用コマンド
├── requirements.txt        # Python依存関係
├── .env.example           # 環境変数テンプレート
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
# .envファイルを編集してGoogle Maps APIキーを設定
```

### 3. アプリケーションの起動

```bash
streamlit run app/streamlit_app.py
```

アプリケーションは [http://localhost:8501](http://localhost:8501) でアクセス可能になります。

## 🐳 Docker での実行

### ローカルでのビルドと実行

```bash
# Dockerイメージのビルド
make build

# ローカルでの実行
GOOGLE_MAPS_API_KEY="your_api_key_here" make run-local
```

## ☁️ Google Cloud Run へのデプロイ

### 前提条件

- Google Cloud SDKがインストールされていること
- Google Cloud プロジェクトが設定されていること
- Geocoding APIが有効になっていること

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

以下の形式のCSVファイルを準備してください：

```csv
番号,掲示場番号,住所,名称
1,1-1,京橋１丁目１９番１３号先,楓川久安橋公園
2,1-2,京橋２丁目１８番１号先,弾正橋北西側欄干
```

### 2. Webアプリケーションでの処理

1. CSVファイルをアップロード
2. 都道府県・市区町村を設定
3. 列マッピングを設定（どの列が番号、住所、名称かを指定）
4. Google Maps APIキーを入力
5. 処理を実行
6. 正規化済みCSVをダウンロード

### 3. 出力形式

処理後のCSVは以下の形式で出力されます：

```csv
prefecture,city,number,address,name,lat,long
東京都,中央区,1-1,京橋１丁目１９番１３号先,楓川久安橋公園,35.677349,139.7740739
東京都,中央区,1-2,京橋２丁目１８番１号先,弾正橋北西側欄干,35.6752085,139.7727527
```

## ⚙️ 設定オプション

### APIコール間隔

Google Maps APIの利用制限を避けるため、APIコール間の待機時間を設定できます（デフォルト: 200ms）。

### 漢数字変換

住所に含まれる漢数字（二丁目、三番など）をアラビア数字（2丁目、3番）に変換するオプションがあります。

## 🔒 セキュリティ

- **APIキーの管理**: 本番環境では環境変数またはSecret Managerを使用
- **アクセス制御**: Cloud Runでの認証設定が可能
- **ログ管理**: 機密情報がログに出力されないよう配慮

## 📌 注意事項

- Google Maps Geocoding APIは課金対象です。使用量制限の設定を推奨します
- 大量データ処理時は、APIコール間隔を適切に設定してください
- 処理中はブラウザを閉じないでください

## 🛠️ トラブルシューティング

### よくある問題

1. **APIキーエラー**: Geocoding APIが有効になっているか確認
2. **権限エラー**: Cloud RunサービスアカウントにSecret Manager権限があるか確認
3. **メモリエラー**: 大量データ処理時はCloud Runのメモリ設定を増加

### ログの確認

```bash
# Cloud Runのログを確認
gcloud logs read --service=csv-normalizer --limit=50
```

## 📜 ライセンス

このプロジェクトは[GPL-3.0 license](https://github.com/team-mirai-volunteer/poster-map/blob/main/LICENSE)の下で公開されています。
