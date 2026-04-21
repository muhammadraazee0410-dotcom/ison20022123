from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection with crash prevention
mongo_url = os.environ.get('MONGO_URL', os.environ.get('MONGODB_URL', ''))
db_name = os.environ.get('DB_NAME', 'iso_transfer_db')

client = None
db = None

if mongo_url and mongo_url.startswith('mongodb'):
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info(f"Successfully initialized MongoDB connection")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")

app = FastAPI(title="ISO 20022 SWIFT Transfer Platform")
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"status": "ONLINE", "database": "CONNECTED" if db is not None else "DISCONNECTED", "message": "Platform Live!"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
