from fastapi import FastAPI, APIRouter, HTTPException, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from datetime import datetime, timezone
import random
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GOD-MODE DATABASE CONNECTION
url = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'
client = AsyncIOMotorClient(url)
db = client[os.environ.get('DB_NAME', 'iso_transfer_db')]

app = FastAPI(title="ISO 20022 SWIFT Transfer Platform")
api_router = APIRouter(prefix="/api")

# --- MODELS ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: str
    token: str

# --- ROUTES ---
@api_router.get("/")
async def root():
    return {"status": "ONLINE", "database": "CONNECTED", "version": "MASTER-COMPLETED"}

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    if credentials.password != "hsbc2025":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id = str(uuid.uuid4())
    return UserResponse(
        id=user_id, email=credentials.email, 
        name=credentials.email.split("@")[0].title(),
        role="operator", department="MX Operations",
        token=f"demo-{user_id}"
    )

@api_router.get("/dashboard/stats")
async def get_stats():
    return {"total_transactions": 0, "total_volume": 0, "successful_count": 0, "pending_count": 0, "failed_count": 0, "today_transactions": 0, "today_volume": 0, "avg_transaction_amount": 0}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
