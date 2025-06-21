# PDF to CSV Converter

PDFファイルからポスター掲示場所の情報を抽出し、緯度経度付きのCSVファイルとして出力するWebアプリケーションです。

## 🚀 機能概要

- **Streamlit Webインターフェース**: 直感的なPDFアップロードと処理画面
- **OpenAI API統合**: 画像PDFからのOCR処理による住所抽出
- **国土地理院API統合**: 住所から緯度経度を自動取得
- **Docker対応**: コンテナ化による簡単なデプロイメント
- **Cloud Run対応**: Google Cloud Runでの本番運用

## 📦 ディレクトリ構成

```
pdf-converter/
├── app/
│   ├── streamlit_app.py      # メインのStreamlitアプリケーション
│   ├── pdf_processor.py      # PDF処理とOCR機能
│   └── config_manager.py     # 設定管理
├── Dockerfile               # Docker設定
├── Makefile                # デプロイメント用コマンド
├── requirements.txt        # Python依存関係
├── .env.example           # 環境変数テンプレート
└── README.md              # このファイル
```

## 🛠️ ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
cd pdf-converter
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
# .envファイルを作成
echo "OPENROUTER_API_KEY=your_api_key_here" > .env
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
OPENROUTER_API_KEY="your_api_key_here" make run-local
```

## ☁️ Google Cloud Run へのデプロイ

### 前提条件

- Google Cloud SDKがインストールされていること
- Google Cloud プロジェクトが設定されていること
- Artifact Registry APIが有効になっていること

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

### 1. PDFファイルの準備

ポスター掲示場所の情報が記載されたPDFファイルを準備してください。画像PDFにも対応しています。

### 2. Webアプリケーションでの処理

1. PDFファイルをアップロード
2. 処理の完了を待つ
3. 結果のCSVファイルをダウンロード

### 3. 出力形式

処理後のCSVは以下の形式で出力されます：

```csv
場所,説明,緯度,経度
京橋１丁目１９番１３号先,楓川久安橋公園,35.677349,139.7740739
京橋２丁目１８番１号先,弾正橋北西側欄干,35.6752085,139.7727527
```

## ⚙️ 設定オプション

### APIキーの管理

- **開発環境**: `.env`ファイルまたは環境変数
- **本番環境**: Google Cloud Secret Manager

### 処理パラメータ

- **OCRモデル**: gpt-4.1-mini（config_manager.pyで変更可能）
- **画像解像度**: 300 DPI（pdf_processor.pyで変更可能）

## 🔒 セキュリティ

- **APIキーの管理**: 環境変数またはSecret Managerを使用
- **一時ファイル**: 処理後に自動削除
- **ログ管理**: 機密情報がログに出力されないよう配慮

## 📌 注意事項

- OpenRouter APIは課金対象です。使用量制限の設定を推奨します
- 大量データ処理時は、Cloud Runのタイムアウト設定に注意してください
- 処理中はブラウザを閉じないでください

## 🛠️ トラブルシューティング

### よくある問題

1. **APIキーエラー**: OPENROUTER_API_KEYが正しく設定されているか確認
2. **権限エラー**: Cloud RunサービスアカウントにSecret Manager権限があるか確認
3. **メモリエラー**: 大量データ処理時はCloud Runのメモリ設定を増加

### ログの確認

```bash
# Cloud Runのログを確認
make logs
```

## 📜 ライセンス

このプロジェクトは[GPL-3.0 license](https://github.com/team-mirai-volunteer/poster-map/blob/main/LICENSE)の下で公開されています。
