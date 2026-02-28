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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="HSBC MX Transaction Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

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
    return {"message": "HSBC MX Transaction Platform API"}

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
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    if not transactions:
        return DashboardStats(
            total_transactions=0,
            total_volume=0,
            successful_count=0,
            pending_count=0,
            failed_count=0,
            today_transactions=0,
            today_volume=0,
            avg_transaction_amount=0
        )
    
    total_volume = sum(t.get('settlement_info', {}).get('interbank_settlement_amount', 0) for t in transactions)
    successful = len([t for t in transactions if t.get('tracking_result') == 'SUCCESSFUL'])
    pending = len([t for t in transactions if t.get('status') == 'PENDING'])
    failed = len([t for t in transactions if t.get('tracking_result') == 'FAILED'])
    
    today = datetime.now(timezone.utc).date().isoformat()
    today_txns = [t for t in transactions if t.get('created_at', '').startswith(today)]
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
        day_offset = 6 - i
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
        if isinstance(t.get('created_at'), str):
            created_at = t['created_at']
        else:
            created_at = t.get('created_at', datetime.now(timezone.utc)).isoformat() if t.get('created_at') else datetime.now(timezone.utc).isoformat()
        
        if isinstance(t.get('updated_at'), str):
            updated_at = t['updated_at']
        else:
            updated_at = t.get('updated_at', datetime.now(timezone.utc)).isoformat() if t.get('updated_at') else datetime.now(timezone.utc).isoformat()
        
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

class TransactionStatusUpdate(BaseModel):
    status: str
    tracking_result: str
    nostro_credited: bool = True
    vostro_debited: bool = True
    network_ack: bool = True

class EmailNotification(BaseModel):
    transaction_id: str
    recipient_email: str
    notification_type: str = "confirmation"

# ============== ACCOUNT MODELS ==============

class RepresentativeInfo(BaseModel):
    name: str
    title_position: Optional[str] = None
    passport_no: str
    passport_issue_place: Optional[str] = None
    passport_issue_country: Optional[str] = None
    passport_issue_date: Optional[str] = None
    passport_expiry_date: Optional[str] = None
    place_of_birth: Optional[str] = None

class BankOfficerInfo(BaseModel):
    name: str
    tel: Optional[str] = None
    email: Optional[str] = None

class AccountCreate(BaseModel):
    account_type: str = "company"
    company_name: str
    company_address: Optional[str] = None
    place_of_incorporation: Optional[str] = None
    registration_nr: Optional[str] = None
    date_established: Optional[str] = None
    representative: RepresentativeInfo
    bank_name: str = "HSBC Continental Europe, Germany"
    bank_address: str = "Hansaallee 3, 40549 Dusseldorf, Germany"
    account_name: str
    account_no: Optional[str] = None
    iban: str
    swift_code: str = "TUBDDEDD"
    gpi_code: Optional[str] = None
    further_credit: Optional[str] = None
    reference: Optional[str] = None
    balance_eur: float = 0.0
    balance_usd: float = 0.0
    bank_officer: Optional[BankOfficerInfo] = None
    status: str = "ACTIVE"

@api_router.patch("/transactions/{transaction_id}/complete")
async def complete_transaction(transaction_id: str):
    """Complete a transaction - update status to FINALIZED and SUCCESSFUL"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": "FINALIZED",
        "tracking_result": "SUCCESSFUL",
        "nostro_credited": True,
        "vostro_debited": True,
        "network_ack": True,
        "reversal_possibility": "NONE",
        "manual_intervention": "NOT REQUIRED",
        "updated_at": now
    }
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    # Log the completion
    logger.info(f"Transaction {transaction_id} completed successfully")
    
    return {
        "message": "Transaction completed successfully",
        "transaction_id": transaction_id,
        "status": "FINALIZED",
        "tracking_result": "SUCCESSFUL",
        "completed_at": now
    }

@api_router.patch("/transactions/{transaction_id}/status")
async def update_transaction_status(transaction_id: str, status_update: TransactionStatusUpdate):
    """Update transaction status"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": status_update.status,
        "tracking_result": status_update.tracking_result,
        "nostro_credited": status_update.nostro_credited,
        "vostro_debited": status_update.vostro_debited,
        "network_ack": status_update.network_ack,
        "updated_at": now
    }
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    return {
        "message": "Transaction status updated",
        "transaction_id": transaction_id,
        "new_status": status_update.status,
        "tracking_result": status_update.tracking_result,
        "updated_at": now
    }

@api_router.post("/transactions/{transaction_id}/send-notification")
async def send_email_notification(transaction_id: str, notification: EmailNotification):
    """Send email notification for a transaction (simulated)"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # In production, this would integrate with an email service
    # For now, we simulate the email sending
    now = datetime.now(timezone.utc).isoformat()
    
    email_record = {
        "id": str(uuid.uuid4()),
        "transaction_id": transaction_id,
        "recipient_email": notification.recipient_email,
        "notification_type": notification.notification_type,
        "subject": f"SWIFT MX Transaction Confirmation - {transaction['uetr']}",
        "sent_at": now,
        "status": "SENT",
        "transaction_details": {
            "uetr": transaction['uetr'],
            "amount": f"{transaction['settlement_info']['currency']} {transaction['settlement_info']['interbank_settlement_amount']:,.2f}",
            "debtor": transaction['debtor']['name'],
            "creditor": transaction['creditor']['name'],
            "status": transaction['tracking_result']
        }
    }
    
    # Store email notification record
    await db.email_notifications.insert_one(email_record)
    
    logger.info(f"Email notification sent for transaction {transaction_id} to {notification.recipient_email}")
    
    return {
        "message": "Email notification sent successfully",
        "notification_id": email_record['id'],
        "recipient": notification.recipient_email,
        "sent_at": now,
        "transaction_uetr": transaction['uetr']
    }

@api_router.get("/transactions/{transaction_id}/notifications")
async def get_transaction_notifications(transaction_id: str):
    """Get all email notifications for a transaction"""
    notifications = await db.email_notifications.find(
        {"transaction_id": transaction_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"notifications": notifications}

@api_router.get("/server-report/{transaction_id}")
async def get_server_report(transaction_id: str):
    """Generate server processing report for a transaction"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    now = datetime.now(timezone.utc)
    
    return {
        "report_type": "SWIFT_SERVER_PROCESSING_REPORT",
        "report_id": f"RPT-{transaction_id[:8].upper()}",
        "generated_at": now.isoformat(),
        "transaction": {
            "id": transaction['id'],
            "uetr": transaction['uetr'],
            "message_type": transaction['message_type'],
            "status": transaction['status'],
            "tracking_result": transaction['tracking_result']
        },
        "server_details": {
            "server_name": "SWIFT_GLOBAL_SERVER_EU",
            "server_location": "Frankfurt, Germany",
            "server_instance": "SAAPROD",
            "alliance_version": "7.5.4"
        },
        "processing_timeline": {
            "message_received": transaction['created_at'],
            "validation_completed": transaction['created_at'],
            "routing_completed": transaction['created_at'],
            "settlement_initiated": transaction['created_at'],
            "settlement_completed": transaction['updated_at'],
            "ack_sent": transaction['updated_at']
        },
        "validation_results": {
            "syntax_validation": "PASSED",
            "semantic_validation": "PASSED",
            "business_validation": "PASSED",
            "compliance_check": "PASSED",
            "sanctions_screening": "CLEARED",
            "duplicate_check": "NO_DUPLICATE"
        },
        "network_status": {
            "swift_network_ack": transaction.get('network_ack', True),
            "correspondent_ack": True,
            "beneficiary_ack": transaction['tracking_result'] == 'SUCCESSFUL'
        },
        "settlement_confirmation": {
            "nostro_credited": transaction.get('nostro_credited', True),
            "vostro_debited": transaction.get('vostro_debited', True),
            "settlement_method": transaction['settlement_info']['method'],
            "settlement_amount": f"{transaction['settlement_info']['currency']} {transaction['settlement_info']['interbank_settlement_amount']:,.2f}"
        },
        "audit_trail": [
            {"timestamp": transaction['created_at'], "event": "MESSAGE_RECEIVED", "status": "SUCCESS"},
            {"timestamp": transaction['created_at'], "event": "VALIDATION_STARTED", "status": "SUCCESS"},
            {"timestamp": transaction['created_at'], "event": "VALIDATION_COMPLETED", "status": "SUCCESS"},
            {"timestamp": transaction['created_at'], "event": "ROUTING_INITIATED", "status": "SUCCESS"},
            {"timestamp": transaction['created_at'], "event": "SETTLEMENT_INITIATED", "status": "SUCCESS"},
            {"timestamp": transaction['updated_at'], "event": "SETTLEMENT_COMPLETED", "status": "SUCCESS"},
            {"timestamp": transaction['updated_at'], "event": "ACK_GENERATED", "status": "SUCCESS"}
        ]
    }

# ============== ACCOUNT ROUTES ==============

@api_router.get("/accounts")
async def get_accounts():
    accounts = await db.accounts.find({}, {"_id": 0}).to_list(1000)
    return accounts

@api_router.get("/accounts/{account_id}")
async def get_account(account_id: str):
    account = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@api_router.post("/accounts")
async def create_account(account: AccountCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = account.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now
    doc["updated_at"] = now
    await db.accounts.insert_one(doc)
    created = await db.accounts.find_one({"id": doc["id"]}, {"_id": 0})
    return created

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str):
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted", "id": account_id}

@api_router.get("/accounts-balance")
async def get_accounts_balance():
    accounts = await db.accounts.find({}, {"_id": 0, "balance_eur": 1, "balance_usd": 1}).to_list(1000)
    total_eur = sum(a.get("balance_eur", 0) for a in accounts)
    total_usd = sum(a.get("balance_usd", 0) for a in accounts)
    eur_to_usd = total_eur * 1.08
    total_combined_usd = total_usd + eur_to_usd
    return {
        "available_eur": total_eur,
        "available_usd": total_usd,
        "total_combined_usd": total_combined_usd,
        "total_combined_eur": total_eur + (total_usd / 1.08),
        "account_count": len(accounts),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/server-terminal")
async def get_server_terminal_logs():
    """Get simulated SWIFT server terminal logs"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    accounts = await db.accounts.find({}, {"_id": 0}).to_list(100)
    now = datetime.now(timezone.utc)

    logs = []
    logs.append({"ts": now.isoformat(), "level": "SYSTEM", "msg": "SWIFT Alliance Gateway v7.5.4 | Server: SAAPROD_EU_FRANKFURT | Uptime: 99.97%"})
    logs.append({"ts": now.isoformat(), "level": "SYSTEM", "msg": "HSBC Continental Europe SA, Germany | BIC: TUBDDEDDXXX | Node: PRIMARY"})
    logs.append({"ts": now.isoformat(), "level": "INFO", "msg": f"Connected accounts: {len(accounts)} | Active sessions: {len(accounts) + 3}"})
    logs.append({"ts": now.isoformat(), "level": "INFO", "msg": f"Total transactions processed today: {len(transactions)}"})
    logs.append({"ts": now.isoformat(), "level": "SYSTEM", "msg": "CBPR+ Compliance Module: ACTIVE | Sanctions Screening: ENABLED"})
    logs.append({"ts": now.isoformat(), "level": "SYSTEM", "msg": "SWIFTNet FIN / MX Gateway: OPERATIONAL | gpi Tracker: CONNECTED"})

    for t in transactions[:10]:
        uetr_short = t.get("uetr", "")[:18]
        amount = t.get("settlement_info", {}).get("interbank_settlement_amount", 0)
        currency = t.get("settlement_info", {}).get("currency", "EUR")
        status = t.get("tracking_result", "UNKNOWN")
        sender = t.get("instructing_agent", {}).get("bic", "N/A")
        receiver = t.get("instructed_agent", {}).get("bic", "N/A")
        msg_type = t.get("message_type", "pacs.009")

        level = "OK" if status == "SUCCESSFUL" else ("WARN" if status == "PENDING" else "ERROR")
        logs.append({"ts": t.get("created_at", now.isoformat()), "level": "INFO", "msg": f"[{msg_type}] UETR:{uetr_short}... | {sender} -> {receiver}"})
        logs.append({"ts": t.get("created_at", now.isoformat()), "level": level, "msg": f"  Settlement: {currency} {amount:,.2f} | Status: {status}"})
        if status == "SUCCESSFUL":
            logs.append({"ts": t.get("updated_at", now.isoformat()), "level": "OK", "msg": "  Nostro/Vostro: CONFIRMED | Network ACK: RECEIVED | gpi: TRACKED"})
        elif status == "PENDING":
            logs.append({"ts": t.get("created_at", now.isoformat()), "level": "WARN", "msg": "  Awaiting settlement confirmation | Nostro: PENDING"})
        else:
            logs.append({"ts": t.get("created_at", now.isoformat()), "level": "ERROR", "msg": "  SETTLEMENT FAILED | Manual intervention: REQUIRED"})

    logs.append({"ts": now.isoformat(), "level": "SYSTEM", "msg": "--- END OF LOG BUFFER --- Next refresh in 30s ---"})
    return {"logs": logs}

@api_router.post("/seed-data")
async def seed_sample_data():
    """Seed the database with sample SWIFT MX transactions"""
    
    # Clear existing data
    await db.transactions.delete_many({})
    
    sample_transactions = [
        # Main transaction from PDF
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "e2e1f9d8-c7b6-4a5e-8d3c-2b1a0f9e8d7c",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "BSCHESMMXXX",
                "name": "BANCO SANTANDER S.A.",
                "country": "ES"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "NORMAL",
                "settlement_date": "2025-12-08",
                "interbank_settlement_amount": 3971000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "GOLD TRADING LIMITED",
                "iban": "DE59300308800000499005",
                "country": "DE"
            },
            "creditor": {
                "name": "INVESTMENT FUND MANAGEMENT",
                "iban": "ES9121000418450200051332",
                "country": "ES"
            },
            "remittance_info": "INVESTMENT PURPOSES",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-08T18:24:39.402+01:00",
            "updated_at": "2025-12-08T18:34:00.000+01:00"
        },
        # Additional sample transactions
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "BNPAFRPPXXX",
                "name": "BNP PARIBAS",
                "country": "FR"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "HIGH",
                "settlement_date": "2025-12-07",
                "interbank_settlement_amount": 1250000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "TECH INNOVATIONS GMBH",
                "iban": "DE89370400440532013000",
                "country": "DE"
            },
            "creditor": {
                "name": "PARIS TECH SOLUTIONS",
                "iban": "FR7630004000031234567890143",
                "country": "FR"
            },
            "remittance_info": "SOFTWARE LICENSE PAYMENT Q4 2025",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-07T14:30:00.000+01:00",
            "updated_at": "2025-12-07T14:45:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "UNCRITMMXXX",
                "name": "UNICREDIT S.P.A.",
                "country": "IT"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "NORMAL",
                "settlement_date": "2025-12-06",
                "interbank_settlement_amount": 875000.50,
                "currency": "EUR"
            },
            "debtor": {
                "name": "DEUTSCHE AUTO PARTS AG",
                "iban": "DE44500105175407324931",
                "country": "DE"
            },
            "creditor": {
                "name": "MILANO AUTOMOTIVE SRL",
                "iban": "IT60X0542811101000000123456",
                "country": "IT"
            },
            "remittance_info": "AUTOMOTIVE PARTS SHIPMENT INV-2025-1234",
            "status": "PENDING",
            "tracking_result": "PENDING",
            "cbpr_compliant": True,
            "nostro_credited": False,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "POSSIBLE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-06T09:15:00.000+01:00",
            "updated_at": "2025-12-06T09:15:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "12345678-90ab-cdef-1234-567890abcdef",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "COBADEFFXXX",
                "name": "COMMERZBANK AG",
                "country": "DE"
            },
            "settlement_info": {
                "method": "CLRG",
                "priority": "NORMAL",
                "settlement_date": "2025-12-05",
                "interbank_settlement_amount": 2500000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "BERLIN EXPORTS GMBH",
                "iban": "DE27100777770209299700",
                "country": "DE"
            },
            "creditor": {
                "name": "FRANKFURT IMPORTS AG",
                "iban": "DE89370400440532013001",
                "country": "DE"
            },
            "remittance_info": "DOMESTIC TRANSFER - TRADE SETTLEMENT",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-05T11:00:00.000+01:00",
            "updated_at": "2025-12-05T11:20:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "abcdef12-3456-7890-abcd-ef1234567890",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "NABOROBUXXXX",
                "name": "NATIONAL BANK OF ROMANIA",
                "country": "RO"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "HIGH",
                "settlement_date": "2025-12-04",
                "interbank_settlement_amount": 450000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "MUNICH ENGINEERING GMBH",
                "iban": "DE75512108001245126199",
                "country": "DE"
            },
            "creditor": {
                "name": "BUCHAREST MACHINERY SRL",
                "iban": "RO49AAAA1B31007593840000",
                "country": "RO"
            },
            "remittance_info": "MACHINERY PURCHASE CONTRACT MC-2025-789",
            "status": "REJECTED",
            "tracking_result": "FAILED",
            "cbpr_compliant": True,
            "nostro_credited": False,
            "vostro_debited": False,
            "network_ack": False,
            "reversal_possibility": "N/A",
            "manual_intervention": "REQUIRED",
            "created_at": "2025-12-04T16:45:00.000+01:00",
            "updated_at": "2025-12-04T17:00:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "fedcba98-7654-3210-fedc-ba9876543210",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "DEUTDEFFXXX",
                "name": "DEUTSCHE BANK AG",
                "country": "DE"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "NORMAL",
                "settlement_date": "2025-12-03",
                "interbank_settlement_amount": 5750000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "HAMBURG SHIPPING CO",
                "iban": "DE91100000000123456789",
                "country": "DE"
            },
            "creditor": {
                "name": "BREMEN LOGISTICS GMBH",
                "iban": "DE89370400440532013002",
                "country": "DE"
            },
            "remittance_info": "SHIPPING SERVICES Q4 2025",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-03T08:30:00.000+01:00",
            "updated_at": "2025-12-03T08:50:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "11223344-5566-7788-99aa-bbccddeeff00",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "INGBNL2AXXX",
                "name": "ING BANK N.V.",
                "country": "NL"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "NORMAL",
                "settlement_date": "2025-12-02",
                "interbank_settlement_amount": 1890000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "STUTTGART PHARMA AG",
                "iban": "DE61100000000123456790",
                "country": "DE"
            },
            "creditor": {
                "name": "AMSTERDAM BIOTECH BV",
                "iban": "NL91ABNA0417164300",
                "country": "NL"
            },
            "remittance_info": "PHARMACEUTICAL RESEARCH COLLABORATION",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-02T13:15:00.000+01:00",
            "updated_at": "2025-12-02T13:35:00.000+01:00"
        },
        {
            "id": str(uuid.uuid4()),
            "message_type": "pacs.009.001.08",
            "uetr": "aabbccdd-eeff-0011-2233-445566778899",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)",
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "KREABOROXXXX",
                "name": "KREDYT BANK S.A.",
                "country": "PL"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "HIGH",
                "settlement_date": "2025-12-01",
                "interbank_settlement_amount": 680000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "DUSSELDORF ELECTRONICS GMBH",
                "iban": "DE71100000000123456791",
                "country": "DE"
            },
            "creditor": {
                "name": "WARSAW TECH SOLUTIONS SP",
                "iban": "PL61109010140000071219812874",
                "country": "PL"
            },
            "remittance_info": "ELECTRONIC COMPONENTS ORDER EC-2025-456",
            "status": "FINALIZED",
            "tracking_result": "SUCCESSFUL",
            "cbpr_compliant": True,
            "nostro_credited": True,
            "vostro_debited": True,
            "network_ack": True,
            "reversal_possibility": "NONE",
            "manual_intervention": "NOT REQUIRED",
            "created_at": "2025-12-01T10:00:00.000+01:00",
            "updated_at": "2025-12-01T10:25:00.000+01:00"
        }
    ]
    
    await db.transactions.insert_many(sample_transactions)
    
    # Seed accounts
    await db.accounts.delete_many({})
    sample_accounts = [
        {
            "id": str(uuid.uuid4()),
            "account_type": "company",
            "company_name": "NADELLA GLOBAL LLC",
            "company_address": "3285 THORNERIDGE TRL, DOUGLASVILLE, GA 30135 USA",
            "registration_nr": "22034274",
            "representative": {
                "name": "MR. BALAJI NADELLA",
                "passport_no": "V 4941458",
                "passport_issue_place": "INDIA",
                "passport_issue_date": "05/03/2022",
                "passport_expiry_date": "04/03/2027"
            },
            "bank_name": "HSBC CONTINENTAL EUROPE, GERMANY",
            "bank_address": "HANSAALLEE 3, DUESSELDORF, 40549- GERMANY",
            "account_name": "BANK OF SCOTIA",
            "account_no": "10600293688071",
            "iban": "DE93300308800293688071",
            "swift_code": "TUBDDEDD",
            "further_credit": "ONE WORLD BANCORP INC",
            "reference": "ONE WORLD BANCORP INC/ NADELLA GLOBAL LLC: ACCOUNT NO.: 24502135",
            "balance_eur": 645230150320.50,
            "balance_usd": 156230100425.25,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "account_type": "company",
            "company_name": "PLINVEST TRUST",
            "company_address": "MOZARTWEG 14, APOLDA, GERMANY",
            "registration_nr": "100056",
            "representative": {
                "name": "LIU BENJUN",
                "passport_no": "EJ3904842",
                "passport_issue_country": "P. R. CHINA",
                "passport_issue_date": "14 APR, 2020",
                "passport_expiry_date": "13 APR, 2030"
            },
            "bank_name": "HSBC TRINKAUS & BURKHARDT",
            "bank_address": "KOENIGSALLEE 21/23, 40002 DUSSELDORF, GERMANY",
            "account_name": "PLINVEST TRUST",
            "iban": "DE28300308802486412944",
            "swift_code": "TUBDDEDD",
            "balance_eur": 578890445200.00,
            "balance_usd": 132340500175.00,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "account_type": "individual",
            "company_name": "ZHANG YINGFAN",
            "company_address": "40212 DUSSELDORF, GERMANY",
            "representative": {
                "name": "ZHANG YINGFAN",
                "passport_no": "EH9969130",
                "passport_issue_country": "CHINA",
                "passport_issue_date": "10 JULY 2020",
                "passport_expiry_date": "07 JULY 2030"
            },
            "bank_name": "HSBC GERMANY",
            "bank_address": "KONIGSALLEE 21/23, 40212 DUSSELDORF, GERMANY",
            "account_name": "ZHANG YINGFAN",
            "account_no": "0440334608",
            "iban": "DE78300308800440334608",
            "swift_code": "TUBDDEDDXXX",
            "gpi_code": "TUBDDEDDXXX",
            "bank_officer": {
                "name": "MARIA KENZIE",
                "tel": "0049-2119100",
                "email": "Maria.k_s@hubc.com.de"
            },
            "balance_eur": 423450890130.30,
            "balance_usd": 88970200330.50,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "account_type": "company",
            "company_name": "QIRAT EP GMBH",
            "place_of_incorporation": "REPUBLIC OF SINGAPORE",
            "company_address": "60 PAYA LEBAR ROAD, #12-31 PAYA LEBAR SQUARE, SINGAPORE 409051",
            "registration_nr": "201230687K",
            "representative": {
                "name": "MR. CRAIG L. HUBNER",
                "title_position": "BUSINESS DEVELOPMENT DIRECTOR",
                "passport_no": "PE0385066",
                "passport_issue_country": "AUSTRALIA",
                "passport_issue_date": "15 MAY 2015",
                "passport_expiry_date": "15 MAY 2025"
            },
            "bank_name": "HSBC TRINKAUS & BURKHARDT AG",
            "bank_address": "KOENINGSALLEE 21/23, DUSSELDORF 40002, GERMANY",
            "account_name": "QIRAT EP GMBH",
            "account_no": "0600078006",
            "iban": "DE60300308800600078006",
            "swift_code": "TUBDDEDD",
            "bank_officer": {"name": "TBA"},
            "balance_eur": 498670120480.80,
            "balance_usd": 109450330160.60,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "account_type": "company",
            "company_name": "BONA Verwaltungs GmbH",
            "company_address": "Robert-Bosch-Strasse 7, 36093 Kunzell, Germany / Hessen",
            "registration_nr": "HRB 8743",
            "date_established": "13 February 2024",
            "representative": {
                "name": "Stefan Juli",
                "title_position": "CEO",
                "passport_no": "L5ZN44WF4",
                "passport_issue_country": "Germany",
                "passport_expiry_date": "02/12/2029",
                "place_of_birth": "Fulda"
            },
            "bank_name": "HSBC Continental Europe SA, Germany",
            "bank_address": "Hansaallee 3, 40002 Dusseldorf, Germany",
            "account_name": "Bona Verwaltungs GmbH",
            "iban": "DE64300308800601052008",
            "swift_code": "TUBDDEDD",
            "balance_eur": 332214172878.30,
            "balance_usd": 80782536129.69,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.accounts.insert_many(sample_accounts)
    
    return {"message": f"Successfully seeded {len(sample_transactions)} transactions and {len(sample_accounts)} accounts"}

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
    client.close()
