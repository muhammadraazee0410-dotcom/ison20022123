FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential libjq-dev libffi-dev python3-dev && rm -rf /var/lib/apt/lists/*
# Copy from root first, then backend if needed
COPY requirements.txt . || COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}