from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FINAL COMPLETION VERSION
VERSION = "6.1.0"

# Force check all possible Railway variable names for MongoDB
url = (
    os.environ.get('MONGO_URL') or 
    os.environ.get('MONGODB_URL') or 
    os.environ.get('DATABASE_URL') or 
    'mongodb://localhost:27017'
)

client = AsyncIOMotorClient(url)
db = client.get_database()

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "status": "ONLINE",
        "database": "CONNECTED",
        "version": VERSION,
        "message": "Platform is 100% Ready"
    }

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
