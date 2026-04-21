FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Works whether context is root or backend folder
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}