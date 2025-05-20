from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.cache import CacheMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from datetime import datetime, timedelta
import json
from functools import lru_cache

app = FastAPI(title="LazyCashier Backend")

# Add caching middleware
app.add_middleware(
    CacheMiddleware,
    cache_time=300  # Cache for 5 minutes
)

# Enable CORS with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://lazycashier-e720f.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class AnalyticsData(BaseModel):
    total_revenue: float
    total_transactions: int
    most_popular_item: str
    expenses: Optional[float] = 0

# Cache for analytics data
analytics_cache = {}
CACHE_DURATION = timedelta(minutes=5)

@lru_cache(maxsize=100)
def get_cached_analytics():
    return analytics_cache.get('data')

@app.get("/")
async def read_root():
    return {"message": "Welcome to LazyCashier Backend"}

@app.get("/api/analytics")
async def get_analytics():
    cached_data = get_cached_analytics()
    if cached_data and datetime.now() - cached_data.get('timestamp', datetime.min) < CACHE_DURATION:
        return cached_data['data']
    
    # Your analytics data fetching logic here
    data = {
        "total_revenue": 0,
        "total_transactions": 0,
        "most_popular_item": "",
        "expenses": 0
    }
    
    # Update cache
    analytics_cache['data'] = {
        'data': data,
        'timestamp': datetime.now()
    }
    
    return data

@app.post("/api/analytics/expenses")
async def update_expenses(expense: float):
    try:
        # Your expense update logic here
        return {"status": "success", "message": "Expenses updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/profit")
async def get_profit():
    try:
        # Your profit calculation logic here
        return {"profit": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 