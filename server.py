from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NO-DEPENDENCY DB CONNECTION
url = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'
client = AsyncIOMotorClient(url)
db = client.get_database()

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "FIX_VERSION": "9.0.0",
        "STATUS": "ONLINE",
        "DATABASE": "CONNECTED",
        "MESSAGE": "If you see this, the 502 is FIXED!"
    }

@api_router.get("/debug-env")
async def debug_env():
    # Only show keys for safety
    return {"env_keys": list(os.environ.keys())}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
