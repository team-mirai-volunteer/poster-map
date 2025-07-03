.PHONY: help build run deploy clean

# Load .env file if it exists
-include .env
export

PROJECT_ID ?= $(shell gcloud config get-value project)
SERVICE_NAME = webtool-map2csv
REGION = asia-northeast1
IMAGE_NAME = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/map2csv/$(SERVICE_NAME)

help:
	@echo "利用可能なコマンド:"
	@echo "  build        - Dockerイメージをビルド"
	@echo "  build-linux  - Linux用のDockerイメージをビルド (macOSから)"
	@echo "  run          - ローカルでコンテナを実行"
	@echo "  deploy       - Google Cloud Runにデプロイ"
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
	docker run -p 8501:8501 $(SERVICE_NAME)

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
		--service-account=$(SA_MAP2CSV)

clean:
	@echo "ローカルイメージを削除中..."
	docker rmi $(SERVICE_NAME) $(IMAGE_NAME) 2>/dev/null || true

test-local:
	@echo "ローカルテスト用にコンテナを起動中..."
	docker run -d -p 8501:8501 \
		--name $(SERVICE_NAME)-test \
		$(SERVICE_NAME)
	@echo "アプリケーションは http://localhost:8501 で利用可能です"
	@echo "テスト終了後は 'docker stop $(SERVICE_NAME)-test && docker rm $(SERVICE_NAME)-test' を実行してください"
