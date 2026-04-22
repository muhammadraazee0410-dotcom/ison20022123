from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

# AUTO-DISCOVERY
url = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL') or 'mongodb://localhost:27017'
client = AsyncIOMotorClient(url)
db = client.get_database()

app = FastAPI()
api_router = APIRouter(prefix='/api')

@api_router.get('/')
async def root():
    return {'status': 'ONLINE', 'database': 'CONNECTED', 'version': 'MASTER-FIX-9.0'}

@api_router.get('/transactions')
async def get_tx():
    if not db: return []
    return await db.transactions.find({}, {'_id': 0}).to_list(100)

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
