# -------------------------------
# 1. IMPORTS
# -------------------------------
from sec_edgar_downloader import Downloader
import google.generativeai as genai
import os, re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.embeddings.base import Embeddings
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import plotly.express as px
import json

# -------------------------------
# 2. CONFIGURE GEMINI
# -------------------------------

load_dotenv()
genai.configure(api_key=os.getenv('gemini_api_key'))

# Preferred model order (free-tier friendly first)
MODEL_CANDIDATES = [
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemma-3-1b",
    "gemma-3-2b",
    "gemma-3-4b",
    "gemma-3-12b",
    "gemma-3-27b",
]

def generate_with_fallback(prompt: str):
    """
    Try candidate models in order until one succeeds.
    Returns generate_content response.
    """
    last_error = None
    for model_name in MODEL_CANDIDATES:
        try:
            model = genai.GenerativeModel(model_name)
            return model.generate_content(prompt)
        except Exception as exc:  # graceful fallback on quota/availability errors
            last_error = exc
            print(f"[WARN] Model {model_name} failed: {exc}")
            continue
    raise last_error if last_error else RuntimeError("No Gemini model succeeded")

# -------------------------------
# 5. LOCAL EMBEDDINGS (Lazy Loading)
# -------------------------------
class LocalSentenceEmbedding(Embeddings):
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model_name = model_name
        self._model = None
    
    @property
    def model(self):
        if self._model is None:
            print("[INFO] Loading local embedding model...")
            self._model = SentenceTransformer(self.model_name)
        return self._model
    
    def embed_documents(self, texts):
        return self.model.encode(texts, show_progress_bar=True).tolist()
    
    def embed_query(self, text):
        return self.model.encode([text])[0].tolist()

# Lazy initialization - model loads only when needed
embedding = None

def get_embedding():
    global embedding
    if embedding is None:
        embedding = LocalSentenceEmbedding()
    return embedding

VECTOR_DIR = "./chroma_store"
# -------------------------------
# 3. LOAD / DOWNLOAD 10-K
# -------------------------------

def extract_json(text):
    """
    Extracts the first valid JSON object from LLM output
    """
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found")
    return json.loads(match.group())

def analyze_force(ticker):
    base_path = f"sec-edgar-filings/{ticker}/10-K"

    email = os.getenv("email")
    if not email:
        raise ValueError("Email not set in .env (key: email)")

    if not os.path.exists(base_path):
        print("[INFO] 10-K not found. Downloading...")
        dl = Downloader("porterAI", email)
        dl.get("10-K", ticker)
    else:
        print(f"[INFO] 10-K already available for {ticker} .")

    latest_folder = sorted(os.listdir(base_path), reverse=True)[0]
    file_path = os.path.join(base_path, latest_folder, "full-submission.txt")

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_text = f.read()

    text = re.sub(r"<.*?>", " ", raw_text)
    text = re.sub(r"\s+", " ", text)

    # -------------------------------
    # 4. CHUNKING
    # -------------------------------
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    chunks = splitter.split_text(text)
    print(f"[INFO] Total text chunks created: {len(chunks)}")

    # -------------------------------
    # 6. VECTOR DB LOAD OR CREATE
    # -------------------------------

    if os.path.exists(os.path.join(VECTOR_DIR, "chroma.sqlite3")):
        print("[INFO] Existing Chroma vector DB found. Loading...")
        vector_db = Chroma(
            persist_directory=VECTOR_DIR,
            embedding_function=get_embedding()
        )
    else:
        print("[INFO] No vector DB found. Creating embeddings and storing...")
        vector_db = Chroma.from_texts(
            texts=chunks,
            embedding=get_embedding(),
            persist_directory=VECTOR_DIR
        )
        vector_db.persist()
        print("[INFO] Vector DB created and persisted.")

    print(f"[INFO] Total vectors stored: {vector_db._collection.count()}")

    # -------------------------------
    # 7. RETRIEVER
    # -------------------------------
    retriever = vector_db.as_retriever(search_kwargs={"k": 4})
    print("[INFO] Retriever initialized.")

    # -------------------------------
    # 8. GEMINI LLM
    # -------------------------------

    # -------------------------------
    # 9. PORTER'S FIVE FORCES
    # -------------------------------
    forces = {
    "Bargaining Power of Buyers": [
        "net sales",
        "revenue by product",
        "gross margin",
        "pricing",
        "sales concentration"
    ],
    "Bargaining Power of Suppliers": [
        "cost of sales",
        "inventory",
        "supplier",
        "manufacturing",
        "risk factors"
    ],
    "Industry Rivalry": [
        "research and development",
        "marketing",
        "competition",
        "operating expenses"
    ],
    "Threat of Substitutes": [
        "alternative products",
        "product differentiation",
        "switching costs",
        "substitute threats",
        "customer preferences",
        "open source",
        "replacement technology",
        "commoditization",
        "adjacent markets"
    ],
    "Threat of New Entrants": [
        "barriers to entry",
        "capital requirements",
        "market access",
        "brand loyalty",
        "economies of scale",
        "regulation",
        "patents",
        "switching costs",
        "distribution"
    ]
    }

    final_report = {}

    for force, query in forces.items():
        print(f"[INFO] Analyzing: {force}")
        for q in query:
            docs = retriever.invoke(q)
        if not docs:
            print("[WARNING] No relevant context retrieved.")
            continue
        context = "\n".join(d.page_content for d in docs)

        # Optimized: Combined single prompt to reduce token usage (was 2 API calls)
        combined_prompt = f"""You are a financial analyst. Analyze this Porter Force concisely.

    Force: {force}

    Context from 10-K:
    {context}

    Output ONLY these sections (be concise):

    EXPLANATION
    Brief explanation (2-3 sentences). If substitutes or entrants are not explicit, infer plausible substitutes/entrants from context signals (products, tech, channels, regions).

    KEY_NUMBERS
    List numerical values found. If none, write "None". Prefer: revenue/margin trends, segment/geo mix, R&D %, capex, customer/supplier concentration, unit volumes.

    ORGANIZATION_VIEW
    Operational implications (2 bullets). Mention switching costs, differentiation, IP/regulatory barriers, distribution strength, brand loyalty if present or implied.

    INVESTOR_VIEW
    Risk and return implications (2 bullets). Note margin pressure, moat durability, entry barriers, and substitution risk.

    METRICS_JSON
    {{"force": "{force}", "metrics": [{{"name": "...", "value": number, "unit": "...", "year": "...", "description": "..."}}]}}
    If no numbers: {{"force": "{force}", "metrics": []}}
    """

        # Single API call instead of two
        response = generate_with_fallback(combined_prompt)
        text_output = response.text
        
        # Extract JSON
        try:
            numeric_data = extract_json(text_output)
        except:
            numeric_data = {"force": force, "metrics": []}

        final_report[force] = {
            'text_analysis': text_output,
            "numerical_analysis": numeric_data
        }

    print(final_report)
    return final_report


# LEGACY CODE BELOW - KEPT FOR REFERENCE BUT NOT USED
def _old_two_prompt_method():
        """
        This old method used 2 API calls per force (6 total for 3 forces).
        New combined_prompt reduces this to 1 call per force (3 total).
        """
        prompt = f"""
    You are a financial analyst.

    Analyze the following Porter’s Five Force for the company.

    Force:
    {force}

    Context extracted from the company’s 10-K filing:
    {context}

    Instructions:
    1. Explain this force clearly in simple language suitable for a naive investor and Organization.
    2. Identify and explicitly mention any numerical information present in the context,
    such as percentages, counts, time durations, revenue concentration, number of suppliers,
    customers, competitors, or financial figures.
    3. If no numerical evidence is explicitly available, clearly state:
    "No explicit numerical data disclosed for this force."
    4. Provide two viewpoints:
    a) Organization Perspective – how the company experiences or manages this force.
    b) Investor Perspective – what this force means for investment risk or stability.

    Output Format (STRICT):

    Explanation:
    <clear explanation>

    Explanation (5–8 lines)

    Numerical Evidence:
    • Direct data OR
    • Proxy metric OR
    • Derived ratio
    If explicit numerical data is unavailable, derive proxy numerical evidence using 
    financial ratios, industry benchmarks, or logical quantification. Avoid stating ‘no numerical data available’.

    Organization Perspective:
    • Operational implication
    • Strategic response

    Investor Perspective:
    • Risk
    • Return stability
    • Margin impact

    """
