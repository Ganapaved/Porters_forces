# Porter's Five Forces Analyzer - Quick Start Guide

## What Changed?

### 🎨 New Frontend (React + Vite)

- **Beautiful, responsive web interface** instead of raw JSON
- Enter stock ticker and email, get human-readable analysis
- Real-time loading feedback and card-based results layout
- Built with React and Vite for modern, fast development

### ⚡ Token Optimization (50% reduction)

- **Before**: 2 API calls per force (6 total for 3 forces) = ~2000+ tokens
- **After**: 1 combined API call per force (3 total) = ~1000 tokens
- Much faster and cheaper analysis

---

## How to Use

### Start the Backend Server

```bash
cd backend
uvicorn server:app --reload
# Server runs on http://127.0.0.1:8000
```

### Set Up and Run the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

4. Open your browser and navigate to `http://localhost:5173`

5. Enter:
   - **Stock Ticker**: AAPL, NVDA, MSFT, etc.
   - **Email**: Any valid email (required by SEC API)

6. Click "Analyze" and wait 2-3 minutes

### What You'll See

Analysis for each of the 3 Porter Forces:

- **📝 Explanation**: What the force means in simple language
- **📊 Key Numbers**: Financial metrics from the 10-K filing
- **🏢 Organization View**: How the company manages this force
- **💰 Investor View**: What this force means for your investment

---

## Project Structure

```
Porters_forces/
├── frontend/                  ← React frontend
│   ├── src/                   ← React components and logic
│   ├── index.html             ← HTML entry point
│   ├── package.json           ← Frontend dependencies
│   └── vite.config.js         ← Vite configuration
├── .github/
│   └── copilot-instructions.md ← AI agent docs
└── backend/
    ├── app.py                 ← Analysis engine (optimized prompts)
    ├── server.py              ← FastAPI endpoints
    └── requirements.txt       ← Dependencies
```

---

## Troubleshooting

| Issue                           | Solution                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Connection refused" error      | Make sure backend server is running with `uvicorn server:app --reload`                                            |
| Analysis takes too long         | Normal (2-3 min). Download/embedding/analysis for first ticker is slow. Subsequent tickers use cached embeddings. |
| No results appear               | Check browser console (F12) for error messages. Verify email format is correct.                                   |
| "No relevant context retrieved" | The stock ticker may not have recent 10-K filing. Try AAPL or NVDA (known to work).                               |

---

## What's Under the Hood?

1. **Download**: SEC Edgar Downloader fetches latest 10-K filing
2. **Extract**: Parse filing, remove HTML, split into 800-char chunks
3. **Embed**: SentenceTransformer converts chunks to vectors (cached)
4. **Retrieve**: Find top-4 relevant chunks per force
5. **Analyze**: Gemini 2.5 Flash generates explanation + metrics
6. **Display**: Frontend renders beautiful cards with results

---

## Environment Setup

Create or update `.env` in `backend/` folder:

```
gemini_api_key=<your-google-generativeai-key>
email=<your-email>
```

Get a free Gemini API key: https://ai.google.dev/

---

## Performance Improvements Made

✅ **50% token reduction**: Combined single prompt instead of 2  
✅ **Responsive UI**: No more staring at JSON  
✅ **Better UX**: Error handling, loading states, email caching  
✅ **Maintainable**: Clear code structure for future enhancements

---

**Next Steps**: Run `npm install` and `npm run dev` in the `frontend/` directory, then analyze your favorite company!
