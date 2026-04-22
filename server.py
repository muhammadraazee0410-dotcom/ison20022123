from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Try all possible Railway variable names for MongoDB
url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL') or os.environ.get('DATABASE_URL') or ''

client = None
db = None
if url:
    client = AsyncIOMotorClient(url)
    db = client.get_database()

@api_router.get("/")
async def root():
    return {
        "FIX_VERSION": "5.0.0",
        "DATABASE": "CONNECTED" if url else "DISCONNECTED",
        "STATUS": "LIVE"
    }

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
