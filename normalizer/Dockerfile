# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Use secret during build to create .env file
RUN --mount=type=secret,id=google_maps_api_key \
    if [ -f /run/secrets/google_maps_api_key ]; then \
        echo "GOOGLE_MAPS_API_KEY=$(cat /run/secrets/google_maps_api_key)" > /app/.env; \
    fi

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

CMD ["streamlit", "run", "app/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.headless=true", "--server.fileWatcherType=none"]
