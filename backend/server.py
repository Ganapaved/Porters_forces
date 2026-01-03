from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os

load_dotenv()

from app import analyze_force  # your existing file

app = FastAPI(title="Porter Five Forces API")

# ------------------------------
# CORS
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

SEC_COMPANY_URL = "https://www.sec.gov/files/company_tickers.json"

HEADERS = {
    "User-Agent": f"PorterAI {os.getenv('email')}"
}


@app.get("/")
def home():
    return {"status": "running"}


@app.get("/companies")
def list_companies(limit: int = 50):
    """
    Returns live list of companies from SEC
    Used for dropdown selection
    """
    resp = requests.get(SEC_COMPANY_URL, headers=HEADERS)
    data = resp.json()

    companies = [
        {
            "ticker": v["ticker"],
            "name": v["title"],
            "cik": str(v["cik_str"])
        }
        for v in data.values()
    ]

    return companies[:limit]  # frontend-friendly


@app.get("/analyze")
def analyze(
    ticker: str = Query(..., description="Ticker symbol (AAPL, MSFT)"),
    email: str = Query(..., description="Email required by SEC")
):
    ticker = ticker.upper()

    try:
        result = analyze_force(ticker, email)
        return {
            "ticker": ticker,
            "analysis": result
        }
    except Exception as e:
        return {"error": str(e)}
