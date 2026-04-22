from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Automatically find database link
url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'
client = AsyncIOMotorClient(url)
db = client.get_database()

@api_router.get("/")
async def root():
    return {"status": "ONLINE", "database": "CONNECTED", "version": "6.0.0"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
