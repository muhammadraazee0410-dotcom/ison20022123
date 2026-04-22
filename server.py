import os
import logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

# Force setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('swift-api')

app = FastAPI()

# Middleware first
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

# Connection logic
MONGO_URL = os.environ.get('MONGODB_URL') or os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL')

@app.get('/')
async def root():
    return {"status": "ONLINE", "version": "10.0.0", "db_configured": bool(MONGO_URL)}

@app.get('/api/')
async def api_root():
    return {"status": "OK"}

# Ensure root routes work for Railway healthchecks
@app.get('/health')
async def health():
    return "OK"

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
