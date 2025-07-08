# 本番デプロイガイド

## 前提条件

### 必須要件
- Docker および Docker Compose
- Google Cloud Project （GCS使用時）
- OpenRouteService APIキー

### 推奨環境
- メモリ: 最低 1GB、推奨 2GB以上
- CPU: 最低 1vCPU、推奨 2vCPU以上
- ストレージ: 最低 5GB

## デプロイ手順

### 1. 環境設定

```bash
# リポジトリをクローン
git clone <repository-url>
cd poster-map/route_optimizer

# 環境変数ファイルを作成
cp .env.example .env
```

### 2. 環境変数の設定

`.env` ファイルを編集:

```bash
# 本番環境設定
GCS_BUCKET_NAME=your-production-bucket-name
GOOGLE_CLOUD_PROJECT=your-project-id
APP_ENV=production
LOG_LEVEL=INFO
```

### 3. Google Cloud Storage 設定

```bash
# サービスアカウントキーを作成し、環境変数で指定
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# または、GCPインスタンス上でサービスアカウントを使用
```

### 4. Dockerビルドと起動

```bash
# イメージをビルド
docker build -t route-optimizer:latest .

# コンテナを起動
docker run -d \
  --name route-optimizer \
  --env-file .env \
  -v /path/to/service-account-key.json:/app/service-account-key.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json \
  -p 8501:8501 \
  route-optimizer:latest
```

### 5. Docker Compose を使用する場合

```yaml
# docker-compose.yml
version: '3.8'
services:
  route-optimizer:
    build: .
    ports:
      - "8501:8501"
    env_file:
      - .env
    volumes:
      - ./service-account-key.json:/app/service-account-key.json
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8501/_stcore/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# 起動
docker-compose up -d
```

## Cloud Run デプロイ

### 1. Cloud Build でビルド

```bash
# Cloud Build を使用してイメージをビルド
gcloud builds submit --tag gcr.io/PROJECT_ID/route-optimizer

# または、Artifact Registry を使用
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/route-optimizer
```

### 2. Cloud Run にデプロイ

```bash
gcloud run deploy route-optimizer \
  --image gcr.io/PROJECT_ID/route-optimizer \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=your-bucket-name \
  --set-env-vars APP_ENV=production \
  --memory 2Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

## 監視とメンテナンス

### ログ確認

```bash
# Dockerコンテナのログ
docker logs route-optimizer

# Cloud Runのログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=route-optimizer"
```

### ヘルスチェック

```bash
# アプリケーションの健全性確認
curl http://localhost:8501/_stcore/health
```

### バックアップ

```bash
# GCSバケットのバックアップ（定期実行推奨）
gsutil -m cp -r gs://source-bucket gs://backup-bucket
```

## セキュリティ設定

### ファイアウォール設定
- ポート 8501 のみを必要な接続元に開放
- HTTPSプロキシ経由でのアクセスを推奨

### APIキー管理
- OpenRouteService APIキーは環境変数で管理
- 定期的なAPIキーローテーション

### アクセス制御
- 必要に応じてBasic認証やOAuth実装を検討
- Cloud Run の場合、IAMでアクセス制御

## トラブルシューティング

### よくある問題

1. **GCS接続エラー**
   - サービスアカウントキーの確認
   - バケット名とプロジェクトIDの確認

2. **メモリ不足**
   - Docker/Cloud Run のメモリ制限を確認
   - 大量地点処理時は制限値を調整

3. **API Rate Limit**
   - OpenRouteService の制限（40req/min）を確認
   - 地点数が多い場合の分割処理

### ログファイル確認
- アプリケーションログ: `/app/app.log`（本番環境）
- Streamlit ログ: コンソール出力

## パフォーマンス最適化

### 推奨設定
- メモリ: 2GB以上
- CPU: 2vCPU以上
- GCSキャッシュの活用

### 監視メトリクス
- レスポンス時間
- エラー率
- リソース使用率