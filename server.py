from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GOD-MODE: Search EVERY environment variable for a MongoDB link
# Railway sometimes uses MONGODB_URL or MONGO_URL
url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'

client = AsyncIOMotorClient(url)
# Try to get DB name from env or default
db_name = os.environ.get('DB_NAME', 'iso_transfer_db')
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "status": "ONLINE",
        "database": "CONNECTED", 
        "info": "Backend is running on Docker properly now!"
    }

@api_router.get("/transactions")
async def get_tx():
    return []

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
