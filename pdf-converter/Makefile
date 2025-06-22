.PHONY: build push run-local deploy setup-secrets clean

PROJECT_ID ?= $(shell gcloud config get-value project)
REGION ?= asia-northeast1
SERVICE_NAME = pdf-converter
IMAGE_NAME = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(SERVICE_NAME)/$(SERVICE_NAME)

build:
	docker build --platform linux/amd64 -t $(SERVICE_NAME) .
	docker tag $(SERVICE_NAME) $(IMAGE_NAME)

push: build
	docker push $(IMAGE_NAME)

run-local:
	@if [ -z "$(OPENROUTER_API_KEY)" ]; then \
		echo "Error: OPENROUTER_API_KEY environment variable is required"; \
		echo "Usage: OPENROUTER_API_KEY=your_key_here make run-local"; \
		exit 1; \
	fi
	docker run --rm -p 8501:8501 \
		-e OPENROUTER_API_KEY=$(OPENROUTER_API_KEY) \
		$(SERVICE_NAME)

setup-secrets:
	@echo "Setting up Google Cloud secrets..."
	@read -p "Enter your OpenRouter API key: " api_key; \
	echo "$$api_key" | gcloud secrets create openrouter-api-key --data-file=-

deploy:
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 2Gi \
		--cpu 2 \
		--timeout 3600 \
		--port 8501 \
		--set-secrets OPENROUTER_API_KEY=openrouter-api-key:latest

clean:
	docker rmi $(SERVICE_NAME) 2>/dev/null || true
	docker system prune -f

logs:
	gcloud logs read --service=$(SERVICE_NAME) --limit=50

status:
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION)
