from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def root():
    return {"status": "OK", "version": "8.0.0", "database": "READY_FOR_CONNECTION"}

@app.get("/api/")
async def api_root():
    return {"status": "OK", "version": "8.0.0"}
