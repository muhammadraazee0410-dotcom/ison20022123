from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Try all possible Railway MongoDB variable names
url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL') or os.environ.get('DATABASE_URL')

client = None
db = None
if url:
    client = AsyncIOMotorClient(url)
    db = client.get_database()

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "FIX_VERSION": "3.0.0",
        "DATABASE_STATUS": "CONNECTED" if url else "DISCONNECTED - ADD MONGO_URL TO VARIABLES",
        "HINT": "If this doesn't say 3.0.0, the site hasn't updated yet!"
    }

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
