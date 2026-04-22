from fastapi import FastAPI, APIRouter, HTTPException, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try every possible Railway variable name automatically
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL') or os.environ.get('DATABASE_URL') or ''
db_name = os.environ.get('DB_NAME', 'iso_transfer_db')

client = None
db = None

if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info("Connected to Database successfully")
    except Exception as e:
        logger.error(f"DB Error: {e}")

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"status": "ONLINE", "database": "CONNECTED" if db is not None else "DISCONNECTED"}

@api_router.get("/transactions")
async def get_tx():
    return []

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
