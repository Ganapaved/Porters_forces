from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

from app import analyze_force  # your existing file
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv('gemini_api_key')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

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

EMAIL = os.getenv('email')
HEADERS = {
    "User-Agent": f"PorterAI {EMAIL or 'missing-email@example.com'}"
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
    ticker: str = Query(..., description="Ticker symbol (AAPL, MSFT)")
):
    ticker = ticker.upper()

    if not EMAIL:
        return {"error": "Email not set in .env (key: email)"}

    try:
        result = analyze_force(ticker)
        return {
            "ticker": ticker,
            "analysis": result
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/company-info")
def get_company_info(
    ticker: str = Query(..., description="Ticker symbol (AAPL, MSFT)"),
    company_name: str = Query("", description="Company name")
):
    """
    Get company overview and history using Gemini API
    """
    ticker = ticker.upper()
    
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not set"}
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Provide a detailed JSON response about the company with ticker symbol {ticker} ({company_name}).
        
        Return ONLY a valid JSON object with this exact structure:
        {{
            "name": "Full company name",
            "description": "A 2-3 sentence description of what the company does",
            "founded": "Year founded (just the year)",
            "headquarters": "City, State/Country",
            "ceo": "Current CEO name",
            "employees": "Number of employees (e.g. '164,000')",
            "marketCap": "Approximate market cap (e.g. '$2.89T')",
            "sector": "Industry sector",
            "history": [
                {{"year": "YYYY", "event": "Significant event description"}},
                {{"year": "YYYY", "event": "Another significant event"}}
            ]
        }}
        
        Include 5-7 major historical events in chronological order.
        Return ONLY the JSON, no additional text or markdown formatting.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            company_data = json.loads(json_match.group())
            return company_data
        else:
            return {"error": "Failed to parse company info"}
            
    except Exception as e:
        return {"error": str(e)}


@app.get("/stock")
def get_stock_data(ticker: str = Query(..., description="Ticker symbol (e.g., AAPL)")):
    """
    Fetch real-time stock data using yfinance
    Returns 30-day price history and key metrics
    """
    import yfinance as yf
    
    ticker = ticker.upper()
    try:
        stock = yf.Ticker(ticker)
        # Fetch 1 month of history for the sparkline
        history = stock.history(period="1mo")
        
        if history.empty:
            return {"error": "No data found for ticker"}
        
        # Format for frontend charting
        chart_data = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "price": float(row["Close"]),
            }
            for date, row in history.iterrows()
        ]
        
        # Key Metrics
        info = stock.info
        latest_price = chart_data[-1]["price"]
        prev_price = chart_data[-2]["price"] if len(chart_data) > 1 else latest_price
        change = latest_price - prev_price
        change_percent = (change / prev_price) * 100 if prev_price != 0 else 0
        
        return {
            "ticker": ticker,
            "current_price": round(latest_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "history": chart_data,
            "summary": {
                "high_52w": info.get("fiftyTwoWeekHigh"),
                "low_52w": info.get("fiftyTwoWeekLow"),
                "volume": info.get("volume"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
            }
        }
    except Exception as e:
        return {"error": str(e)}
