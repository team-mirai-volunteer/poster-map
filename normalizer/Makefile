.PHONY: help build run deploy setup-secrets clean

# Load .env file if it exists
-include .env
export

PROJECT_ID ?= $(shell gcloud config get-value project)
SERVICE_NAME = csv-normalizer
REGION = asia-northeast1
IMAGE_NAME = gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

help:
	@echo "利用可能なコマンド:"
	@echo "  build        - Dockerイメージをビルド"
	@echo "  build-linux  - Linux用のDockerイメージをビルド (macOSから)"
	@echo "  run-local    - ローカルでコンテナを実行"
	@echo "  deploy       - Google Cloud Runにデプロイ"
	@echo "  setup-secrets - Secret Managerの設定"
	@echo "  clean        - ローカルイメージを削除"

build:
	@echo "Dockerイメージをビルド中..."
	docker build -t $(SERVICE_NAME) .
	docker tag $(SERVICE_NAME) $(IMAGE_NAME)

build-linux:
	@echo "Linux用のDockerイメージをビルド中 (macOSから)..."
	docker buildx build --platform linux/amd64 -t $(SERVICE_NAME) --load .
	docker tag $(SERVICE_NAME) $(IMAGE_NAME)

run:
	@echo "ローカルでコンテナを実行中..."
	@if [ -z "$(GOOGLE_MAPS_API_KEY)" ]; then \
		echo "エラー: GOOGLE_MAPS_API_KEYが設定されていません"; \
		echo "使用方法: GOOGLE_MAPS_API_KEY=your-key make run"; \
		echo "または .env ファイルに設定してください"; \
		exit 1; \
	fi
	docker run -p 8501:8501 \
		-e GOOGLE_MAPS_API_KEY="$(GOOGLE_MAPS_API_KEY)" \
		$(SERVICE_NAME)

push:
	@echo "イメージをGoogle Container Registryにプッシュ中..."
	docker push $(IMAGE_NAME)

deploy: build-linux push
	@echo "Google Cloud Runにデプロイ中..."
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--port 8501 \
		--memory 1Gi \
		--cpu 1 \
		--max-instances 10 \
		--service-account=$(SA_NORMALIZER)

clean:
	@echo "ローカルイメージを削除中..."
	docker rmi $(SERVICE_NAME) $(IMAGE_NAME) 2>/dev/null || true

test-local:
	@echo "ローカルテスト用にコンテナを起動中..."
	docker run -d -p 8501:8501 \
		-v ~/.config/gcloud:/root/.config/gcloud:ro \
		-e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/application_default_credentials.json \
		--name $(SERVICE_NAME)-test \
		$(SERVICE_NAME)
	@echo "アプリケーションは http://localhost:8501 で利用可能です"
	@echo "テスト終了後は 'docker stop $(SERVICE_NAME)-test && docker rm $(SERVICE_NAME)-test' を実行してください"
