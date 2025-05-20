from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="LazyCashier Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
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

# In-memory storage (replace with database in production)
analytics_data = AnalyticsData(
    total_revenue=12500.0,
    total_transactions=156,
    most_popular_item="Coffee"
)

@app.get("/")
async def read_root():
    return {"message": "Welcome to LazyCashier Backend"}

@app.get("/api/analytics")
async def get_analytics():
    return analytics_data

@app.post("/api/analytics/expenses")
async def update_expenses(expenses: float):
    if expenses < 0:
        raise HTTPException(status_code=400, detail="Expenses cannot be negative")
    analytics_data.expenses = expenses
    return {"message": "Expenses updated successfully", "expenses": expenses}

@app.get("/api/analytics/profit")
async def get_profit():
    profit = analytics_data.total_revenue - analytics_data.expenses
    return {
        "total_revenue": analytics_data.total_revenue,
        "expenses": analytics_data.expenses,
        "profit": profit
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 