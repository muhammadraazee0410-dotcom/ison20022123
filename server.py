from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

# GOD-MODE: Search EVERY environment variable for a MongoDB link
url = None
for key, value in os.environ.items():
    if 'MONGO' in key and 'URL' in key:
        url = value
        break

# Fallback to general Database URL if MONGO wasn't found
if not url:
    url = os.environ.get('DATABASE_URL')

client = None
db = None
if url:
    client = AsyncIOMotorClient(url)
    db = client.get_database() # Gets the DB name automatically from the URL

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "FIX_VERSION": "3.0.0",
        "DATABASE": "CONNECTED" if db is not None else "DISCONNECTED - HIT REDEPLOY ON RAILWAY",
        "MSG": "Once you hit REDEPLOY, this will turn GREEN!"
    }

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
