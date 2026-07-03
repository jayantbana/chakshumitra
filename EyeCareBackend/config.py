import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("❌ GROQ_API_KEY not found in .env file")

# ── Model configs — swap ACTIVE_MODEL to test different ones ──
MODELS = {
    "smart":   "llama-3.3-70b-versatile",       # Best quality, use in prod
    "fast":    "llama-3.1-8b-instant",           # High RPD, great for testing
    "latest":  "llama-4-scout-17b-16e-instruct", # Llama 4, vision support
    "large":   "llama-4-maverick-17b-128e-instruct",
    "gemma":   "gemma2-9b-it",                   # Highest TPM on free tier
    "mixtral": "mixtral-8x7b-32768",             # Long context
}

ACTIVE_MODEL = MODELS["smart"]  # ← change this to test

llm = ChatGroq(
    model=ACTIVE_MODEL,
    temperature=0,
    api_key=api_key
)

print(f"✅ Groq Model Loaded: {ACTIVE_MODEL}")