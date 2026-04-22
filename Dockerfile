FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn starlette motor pymongo
COPY server.py .
EXPOSE 8000
ENV PORT 8000
CMD ["python", "server.py"]