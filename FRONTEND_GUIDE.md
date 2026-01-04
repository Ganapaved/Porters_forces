# How to Access Your New Frontend

## 🚀 Three Ways to Open the Frontend

### Option 1: File Explorer (Easiest)

1. Navigate to: `C:\Users\Admin\OneDrive\Desktop\POME EL\Project\Porters_forces\`
2. Double-click **`frontend.html`**
3. Browser opens automatically

### Option 2: Copy-Paste URL

1. Open any web browser (Chrome, Firefox, Edge, Safari)
2. Paste this in address bar:
   ```
   file:///C:/Users/Admin/OneDrive/Desktop/POME%20EL/Project/Porters_forces/frontend.html
   ```
3. Press Enter

### Option 3: Terminal

```bash
# On Windows (PowerShell or Command Prompt)
start "C:\Users\Admin\OneDrive\Desktop\POME EL\Project\Porters_forces\frontend.html"

# Or use VS Code (with Live Server extension)
code "C:\Users\Admin\OneDrive\Desktop\POME EL\Project\Porters_forces\frontend.html"
```

---

## ✅ Before Opening Frontend

**Make sure backend is running:**

```bash
cd C:\Users\Admin\OneDrive\Desktop\POME EL\Project\Porters_forces\backend
uvicorn server:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 📋 What to Enter in the Form

| Field      | Example          | Notes                                 |
| ---------- | ---------------- | ------------------------------------- |
| **Ticker** | NVDA             | Stock symbol (case-insensitive)       |
| **Email**  | user@example.com | Any valid email (required by SEC API) |

**Supported companies** (with recent 10-K filings):

- AAPL (Apple)
- NVDA (Nvidia)
- MSFT (Microsoft)
- GOOGL (Google)
- TSLA (Tesla)
- AMZN (Amazon)

---

## ⏱️ Timeline

| Stage            | Duration  | What's Happening                                |
| ---------------- | --------- | ----------------------------------------------- |
| **Initial Load** | Instant   | Form appears                                    |
| **First Click**  | 30-60 sec | SEC downloading 10-K filing                     |
| **Processing**   | 1-2 min   | Embedding chunks, semantic search, LLM analysis |
| **Display**      | Instant   | Beautiful cards appear                          |

**Total: 2-3 minutes for first ticker, then results cached**

---

## 🎨 What You'll See

```
┌─────────────────────────────────────────┐
│   📊 Porter's Five Forces Analyzer      │
│   AI-powered analysis from SEC 10-K     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Stock Ticker [NVDA          ]            │
│ Email       [user@exam...   ]            │
│             [Analyze Button]             │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ NVDA - Porter's Five Forces Analysis                     │
└──────────────────────────────────────────────────────────┘

┌────────────────────┐  ┌────────────────────┐
│ Bargaining Power   │  │ Bargaining Power   │
│ of Buyers          │  │ of Suppliers       │
│                    │  │                    │
│ 📝 Explanation     │  │ 📝 Explanation     │
│ 📊 Key Numbers     │  │ 📊 Key Numbers     │
│ 🏢 Org View        │  │ 🏢 Org View        │
│ 💰 Investor View   │  │ 💰 Investor View   │
└────────────────────┘  └────────────────────┘

┌────────────────────┐
│ Industry Rivalry   │
│                    │
│ 📝 Explanation     │
│ 📊 Key Numbers     │
│ 🏢 Org View        │
│ 💰 Investor View   │
└────────────────────┘
```

---

## 🔧 If Something Goes Wrong

### Error: "Connection refused"

**Problem**: Backend server not running
**Fix**:

```bash
# In new terminal:
cd C:\Users\Admin\OneDrive\Desktop\POME EL\Project\Porters_forces\backend
uvicorn server:app --reload
```

### Error: "Analysis failed - timeout"

**Problem**: Analysis took too long (rare)
**Fix**: Refresh page and try again

### Error: "No relevant context retrieved"

**Problem**: Ticker not found or no recent filing
**Fix**: Try a different company (AAPL, NVDA, MSFT known to work)

### No results appear after "Analyzing"

**Problem**: Check browser console for errors
**Fix**:

1. Press `F12` to open Developer Tools
2. Click "Console" tab
3. Look for red error messages
4. Try different ticker

---

## 💡 Tips

✨ **Email reminder**: Frontend saves your email, so you only type it once

⚡ **Faster second time**: Embeddings are cached, so analyzing another ticker takes ~30 seconds

🎨 **Mobile friendly**: Works on phones and tablets! Same responsive design

📊 **Share results**: You can screenshot or copy the formatted cards

---

## 📞 Need Help?

Check [README.md](README.md) for more detailed troubleshooting and technical info.

---

**Ready? Double-click `frontend.html` and start analyzing!** 🚀
