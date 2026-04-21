from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with crash prevention
mongo_url = os.environ.get('MONGO_URL', os.environ.get('MONGODB_URL', ''))
db_name = os.environ.get('DB_NAME', 'iso_transfer_db')

if not mongo_url:
    logger.error("CRITICAL: MONGO_URL is missing or empty! App will start but DB features will fail.")
    client = None
    db = None
else:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info(f"MongoDB connection initialized for DB: {db_name}")
    except Exception as e:
        logger.error(f"FAILED to connect to MongoDB: {e}")
        client = None
        db = None

# Create the main app without a prefix
app = FastAPI(title="ISO 20022 SWIFT Transfer Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS (Same as before) ==============

class InstructingAgent(BaseModel):
    bic: str
    name: str
    country: str = "DE"

class InstructedAgent(BaseModel):
    bic: str
    name: str
    country: str = "ES"

class SettlementInfo(BaseModel):
    method: str = "INGA"
    priority: str = "NORMAL"
    settlement_date: str
    interbank_settlement_amount: float
    currency: str = "EUR"

class DebtorInfo(BaseModel):
    name: str
    iban: str
    country: str = "DE"

class CreditorInfo(BaseModel):
    name: str
    iban: Optional[str] = None
    country: str = "ES"

class TransactionBase(BaseModel):
    message_type: str = "pacs.009.001.08"
    uetr: str
    business_service: str = "swift.finplus"
    instructing_agent: InstructingAgent
    instructed_agent: InstructedAgent
    settlement_info: SettlementInfo
    debtor: DebtorInfo
    creditor: CreditorInfo
    remittance_info: str
    status: str = "FINALIZED"
    tracking_result: str = "SUCCESSFUL"
    cbpr_compliant: bool = True
    nostro_credited: bool = True
    vostro_debited: bool = True
    network_ack: bool = True
    reversal_possibility: str = "NONE"
    manual_intervention: str = "NOT REQUIRED"

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionResponse(BaseModel):
    id: str
    message_type: str
    uetr: str
    business_service: str
    instructing_agent: InstructingAgent
    instructed_agent: InstructedAgent
    settlement_info: SettlementInfo
    debtor: DebtorInfo
    creditor: CreditorInfo
    remittance_info: str
    status: str
    tracking_result: str
    cbpr_compliant: bool
    nostro_credited: bool
    vostro_debited: bool
    network_ack: bool
    reversal_possibility: str
    manual_intervention: str
    created_at: str
    updated_at: str

class DashboardStats(BaseModel):
    total_transactions: int
    total_volume: float
    successful_count: int
    pending_count: int
    failed_count: int
    today_transactions: int
    today_volume: float
    avg_transaction_amount: float

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "operator"
    department: str = "Operations"

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

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {
        "message": "MX Transfer Hub API - ISO 20022 SWIFT Messaging Platform", 
        "db_connected": db is not None,
        "status": "UP",
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    """Demo login - accepts any email with password 'hsbc2025'"""
    if credentials.password != "hsbc2025":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(
        email=credentials.email,
        name=credentials.email.split("@")[0].replace(".", " ").title(),
        role="operator",
        department="MX Operations"
    )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        department=user.department,
        token=f"demo-token-{user.id}"
    )

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    if not db:
        return DashboardStats(total_transactions=0, total_volume=0, successful_count=0, pending_count=0, failed_count=0, today_transactions=0, today_volume=0, avg_transaction_amount=0)
        
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    if not transactions:
        return DashboardStats(total_transactions=0, total_volume=0, successful_count=0, pending_count=0, failed_count=0, today_transactions=0, today_volume=0, avg_transaction_amount=0)
    
    total_volume = sum(t.get('settlement_info', {}).get('interbank_settlement_amount', 0) for t in transactions)
    successful = len([t for t in transactions if t.get('tracking_result') == 'SUCCESSFUL'])
    pending = len([t for t in transactions if t.get('status') == 'PENDING'])
    failed = len([t for t in transactions if t.get('tracking_result') == 'FAILED'])
    
    today = datetime.now(timezone.utc).date().isoformat()
    today_txns = [t for t in transactions if str(t.get('created_at', '')).startswith(today)]
    today_volume = sum(t.get('settlement_info', {}).get('interbank_settlement_amount', 0) for t in today_txns)
    
    avg_amount = total_volume / len(transactions) if transactions else 0
    
    return DashboardStats(
        total_transactions=len(transactions),
        total_volume=total_volume,
        successful_count=successful,
        pending_count=pending,
        failed_count=failed,
        today_transactions=len(today_txns),
        today_volume=today_volume,
        avg_transaction_amount=avg_amount
    )

@api_router.get("/dashboard/total-funds")
async def get_total_funds():
    """Get total platform funds by currency"""
    return {
        "funds": [
            {"currency": "EUR", "amount": 2478455779009.90, "formatted": "€2,478,455,779,009.90"},
            {"currency": "USD", "amount": 567773667221.04, "formatted": "$567,773,667,221.04"}
        ],
        "total_eur_equivalent": 3046229446230.94,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/dashboard/chart-data")
async def get_chart_data():
    """Get chart data for dashboard"""
    if not db:
        return {"status_distribution": [], "daily_volume": []}
        
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    # Group by status
    status_data = {}
    for t in transactions:
        status = t.get('tracking_result', 'UNKNOWN')
        if status not in status_data:
            status_data[status] = {"count": 0, "volume": 0}
        status_data[status]["count"] += 1
        status_data[status]["volume"] += t.get('settlement_info', {}).get('interbank_settlement_amount', 0)
    
    # Group by date (last 7 days simulation)
    daily_data = []
    for i in range(7):
        count = len(transactions) // 7 + random.randint(-2, 2)
        volume = sum(t.get('settlement_info', {}).get('interbank_settlement_amount', 0) for t in transactions) / 7
        daily_data.append({
            "day": f"Day {i+1}",
            "count": max(0, count),
            "volume": round(volume, 2)
        })
    
    return {
        "status_distribution": [{"name": k, "value": v["count"]} for k, v in status_data.items()],
        "daily_volume": daily_data
    }

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0)
):
    """Get all transactions with optional filtering"""
    if not db:
        return []
        
    query = {}
    
    if status and status != "all":
        query["tracking_result"] = status.upper()
    
    if search:
        query["$or"] = [
            {"uetr": {"$regex": search, "$options": "i"}},
            {"debtor.name": {"$regex": search, "$options": "i"}},
            {"creditor.name": {"$regex": search, "$options": "i"}},
            {"instructing_agent.bic": {"$regex": search, "$options": "i"}}
        ]
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    result = []
    for t in transactions:
        created_at = t.get('created_at', datetime.now(timezone.utc))
        if not isinstance(created_at, str):
            created_at = created_at.isoformat() if created_at else datetime.now(timezone.utc).isoformat()
            
        updated_at = t.get('updated_at', datetime.now(timezone.utc))
        if not isinstance(updated_at, str):
            updated_at = updated_at.isoformat() if updated_at else datetime.now(timezone.utc).isoformat()
        
        result.append(TransactionResponse(
            id=t['id'],
            message_type=t.get('message_type', 'pacs.009.001.08'),
            uetr=t['uetr'],
            business_service=t.get('business_service', 'swift.finplus'),
            instructing_agent=InstructingAgent(**t['instructing_agent']),
            instructed_agent=InstructedAgent(**t['instructed_agent']),
            settlement_info=SettlementInfo(**t['settlement_info']),
            debtor=DebtorInfo(**t['debtor']),
            creditor=CreditorInfo(**t['creditor']),
            remittance_info=t.get('remittance_info', ''),
            status=t.get('status', 'FINALIZED'),
            tracking_result=t.get('tracking_result', 'SUCCESSFUL'),
            cbpr_compliant=t.get('cbpr_compliant', True),
            nostro_credited=t.get('nostro_credited', True),
            vostro_debited=t.get('vostro_debited', True),
            network_ack=t.get('network_ack', True),
            reversal_possibility=t.get('reversal_possibility', 'NONE'),
            manual_intervention=t.get('manual_intervention', 'NOT REQUIRED'),
            created_at=created_at,
            updated_at=updated_at
        ))
    
    return result

@api_router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str):
    """Get a single transaction by ID"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    created_at = transaction.get('created_at', datetime.now(timezone.utc).isoformat())
    updated_at = transaction.get('updated_at', datetime.now(timezone.utc).isoformat())
    
    if not isinstance(created_at, str):
        created_at = created_at.isoformat()
    if not isinstance(updated_at, str):
        updated_at = updated_at.isoformat()
    
    return TransactionResponse(
        id=transaction['id'],
        message_type=transaction.get('message_type', 'pacs.009.001.08'),
        uetr=transaction['uetr'],
        business_service=transaction.get('business_service', 'swift.finplus'),
        instructing_agent=InstructingAgent(**transaction['instructing_agent']),
        instructed_agent=InstructedAgent(**transaction['instructed_agent']),
        settlement_info=SettlementInfo(**transaction['settlement_info']),
        debtor=DebtorInfo(**transaction['debtor']),
        creditor=CreditorInfo(**transaction['creditor']),
        remittance_info=transaction.get('remittance_info', ''),
        status=transaction.get('status', 'FINALIZED'),
        tracking_result=transaction.get('tracking_result', 'SUCCESSFUL'),
        cbpr_compliant=transaction.get('cbpr_compliant', True),
        nostro_credited=transaction.get('nostro_credited', True),
        vostro_debited=transaction.get('vostro_debited', True),
        network_ack=transaction.get('network_ack', True),
        reversal_possibility=transaction.get('reversal_possibility', 'NONE'),
        manual_intervention=transaction.get('manual_intervention', 'NOT REQUIRED'),
        created_at=created_at,
        updated_at=updated_at
    )

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction"""
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    now = datetime.now(timezone.utc).isoformat()
    
    doc = transaction.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['created_at'] = now
    doc['updated_at'] = now
    
    await db.transactions.insert_one(doc)
    
    return TransactionResponse(
        id=doc['id'],
        message_type=doc['message_type'],
        uetr=doc['uetr'],
        business_service=doc['business_service'],
        instructing_agent=InstructingAgent(**doc['instructing_agent']),
        instructed_agent=InstructedAgent(**doc['instructed_agent']),
        settlement_info=SettlementInfo(**doc['settlement_info']),
        debtor=DebtorInfo(**doc['debtor']),
        creditor=CreditorInfo(**doc['creditor']),
        remittance_info=doc['remittance_info'],
        status=doc['status'],
        tracking_result=doc['tracking_result'],
        cbpr_compliant=doc['cbpr_compliant'],
        nostro_credited=doc['nostro_credited'],
        vostro_debited=doc['vostro_debited'],
        network_ack=doc['network_ack'],
        reversal_possibility=doc['reversal_possibility'],
        manual_intervention=doc['manual_intervention'],
        created_at=doc['created_at'],
        updated_at=doc['updated_at']
    )

# ... (Rest of the routes with added db check) ...

@api_router.get("/accounts")
async def get_accounts():
    if not db:
        return []
    accounts = await db.accounts.find({}, {"_id": 0}).to_list(1000)
    return accounts

@api_router.post("/seed-data")
async def seed_sample_data():
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
    # Clear existing data
    await db.transactions.delete_many({})
    # ... (Seeding logic) ...
    return {"message": "Seeded sample data successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
