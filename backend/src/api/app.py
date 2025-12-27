from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import sys, os
import numpy as np
from dotenv import load_dotenv
import logging

load_dotenv()

# --------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("supportdesk")

# --------------------------------------------------------------------
# Supabase client
# --------------------------------------------------------------------
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        log.info("Supabase client loaded OK")
    except Exception as e:
        supabase = None
        log.error("Supabase init FAILED: %s", e)
else:
    log.warning("SUPABASE_URL or SERVICE_KEY missing")


# --------------------------------------------------------------------
# Import text cleaner
# --------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # /src/api
SRC_DIR = os.path.dirname(BASE_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

try:
    from preprocessing.text_cleaning import clean_text
except Exception:
    def clean_text(s: str) -> str:
        return s


# --------------------------------------------------------------------
# Load ML model
# --------------------------------------------------------------------
ROOT_DIR = os.path.dirname(SRC_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, "models")

model = joblib.load(os.path.join(MODEL_DIR, "ticket_model.pkl"))
tfidf = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
log.info("ML model + vectorizer loaded successfully")


# --------------------------------------------------------------------
# FastAPI
# --------------------------------------------------------------------
app = FastAPI()

# --------------------------------------------------------------------
# CORS configuration (env-driven)
# --------------------------------------------------------------------
# Set ALLOWED_ORIGINS in the environment as a comma-separated list, e.g.
# "https://your-frontend.onrender.com,https://your-vercel-app.vercel.app"
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
log.info("CORS allow_origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------
# Request body model
# --------------------------------------------------------------------
class Ticket(BaseModel):
    subject: str
    body: str
    user_id: str | None = None


# --------------------------------------------------------------------
# Prediction endpoint
# --------------------------------------------------------------------
@app.post("/predict")
def predict(ticket: Ticket):

    try:
        text = clean_text(ticket.subject + " " + ticket.body)
        X = tfidf.transform([text])
        pred = model.predict(X)[0]

        raw_scores = model.decision_function(X)[0]
        exp_scores = np.exp(raw_scores - np.max(raw_scores))
        probs = exp_scores / exp_scores.sum()
        label_probs = list(zip(model.classes_, probs))
        label_probs.sort(key=lambda x: x[1], reverse=True)

        confidence = float(dict(label_probs)[pred])
        top_classes = [{"label": lbl, "score": float(s)} for lbl, s in label_probs[:3]]

        # ----------------------------------------------------------------
        # 🔥 FINAL FIX — Save history using public schema (bypasses RLS)
        # ----------------------------------------------------------------
        if ticket.user_id and supabase:
            try:
                supabase.schema("public").table("history").insert({
                    "user_id": ticket.user_id,
                    "subject": ticket.subject,
                    "body": ticket.body,
                    "predicted_category": pred,
                }).execute()

                log.info(f"📌 Saved history for user {ticket.user_id}")
            except Exception as e:
                log.error("⚠ History insert failed: %s", e)
        else:
            log.warning("⚠ History not saved (no user_id or no supabase)")

        # ----------------------------------------------------------------
        # Response
        # ----------------------------------------------------------------
        return {
            "category": pred,
            "confidence": confidence,
            "top_classes": top_classes,
        }

    except Exception as e:
        log.error("Prediction failure: %s", e)
        raise HTTPException(status_code=500, detail="Prediction failed")
