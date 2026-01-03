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
model = genai.GenerativeModel("gemini-2.5-flash")

# -------------------------------
# 5. LOCAL EMBEDDINGS
# -------------------------------
class LocalSentenceEmbedding(Embeddings):
    def __init__(self,model_name = 'all-MiniLM-L6-v2'):
        print("[INFO] Loading local embedding model...")
        self.model = SentenceTransformer(model_name)
    
    def embed_documents(self, texts):
        return self.model.encode(texts,show_progress_bar=True).tolist()
    
    def embed_query(self, text):
        return self.model.encode([text])[0].tolist()

embedding = LocalSentenceEmbedding()

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

def analyze_force(ticker,email):
    base_path = f"sec-edgar-filings/{ticker}/10-K"

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
            embedding_function=embedding
        )
    else:
        print("[INFO] No vector DB found. Creating embeddings and storing...")
        vector_db = Chroma.from_texts(
            texts=chunks,
            embedding=embedding,
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
        text_response = model.generate_content(prompt)
        text_output = text_response.text

        json_prompt = f"""
    You are a financial analyst.

    Analyze the Porter Force:
    {force}

    Context from company's 10-K:
    {context}

    STRICT RULES:
    - Output ONLY raw JSON
    1. Identify ALL numerical values (revenues, percentages, costs).
    2. If numbers relate indirectly, explain the relationship.
    3. Use numbers ONLY if explicitly present in context.
    4. Output ONLY valid JSON.

    JSON FORMAT:
    {{
    "force": "{force}",
    "metrics": [
        {{
        "name": "Metric Name",
        "value": 0,
        "unit": "%",
        "year": "YYYY",
        "description": "What this metric indicates"
        }}
    ]
    }}

    If no numerical data exists, return:
    {{
    "force": "{force}",
    "metrics": []
    }}
    """

        json_response = model.generate_content(json_prompt)
        numeric_data = extract_json(json_response.text)

        final_report[force]={
            'text_analysis':text_output,
            "numerical_analysis" : numeric_data
        }
    print(final_report)
    return final_report


# # ---------------------------------
# # VISUALIZATION
# # ---------------------------------
# for result in all_results:
#     force = result["force"]
#     metrics = result["metrics"]

#     # Only numeric values
#     numeric_metrics = [
#         m for m in metrics if isinstance(m["value"], (int, float))
#     ]

#     if not numeric_metrics:
#         print(f"[INFO] No numeric data to plot for {force}")
#         continue

#     names = [m["name"] for m in numeric_metrics]
#     values = [m["value"] for m in numeric_metrics]

#     # Matplotlib Bar Chart
#     plt.figure(figsize=(8, 5))
#     plt.bar(names, values)
#     plt.title(f"{force} – Numerical Evidence")
#     plt.ylabel("Value")
#     plt.xticks(rotation=25)
#     plt.tight_layout()
#     plt.show()

#     # Plotly Interactive Chart
#     fig = px.bar(
#         x=names,
#         y=values,
#         title=f"{force} – Interactive Evidence"
#     )
#     fig.show()


