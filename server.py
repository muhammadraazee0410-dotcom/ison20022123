from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import pandas as pd
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GOD-MODE DATABASE CONNECTION
url = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'
client = AsyncIOMotorClient(url)
db = client.get_database()

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"status": "ONLINE", "database": "CONNECTED", "version": "MASTER-COMPLETION-CSV"}

@api_router.get("/transactions/export")
async def export_transactions():
    """Export transactions to CSV"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    if not transactions:
        return Response(content="No transactions found", media_type="text/plain")
    
    # Flatten for CSV
    df = pd.json_normalize(transactions)
    output = io.StringIO()
    df.to_csv(output, index=False)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
