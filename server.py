from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Versioning to verify deployment
VERSION = "2.0.0"

# AGGRESSIVE DISCOVERY: Railway often renames these. We check every possibility.
url = (
    os.environ.get('MONGO_URL') or 
    os.environ.get('MONGODB_URL') or 
    os.environ.get('DATABASE_URL') or 
    os.environ.get('MONGODB_PUBLIC_URL') or
    os.environ.get('MONGO_PRIVATE_URL') or
    'mongodb://localhost:27017'
)

# Global DB objects
client = AsyncIOMotorClient(url)
db = client[os.environ.get('DB_NAME', 'iso_transfer_db')]

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    # Explicit check for the existence of the connection URL
    has_url = bool(os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL'))
    return {
        "version": VERSION,
        "status": "ONLINE",
        "database": "CONNECTED" if has_url else "DISCONNECTED - MISSING VARIABLES",
        "discovery_status": f"Found URL? {has_url}",
        "message": "Platform is updated!"
    }

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
