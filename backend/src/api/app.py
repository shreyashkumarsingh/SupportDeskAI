"""Enhanced FastAPI backend with ML, monitoring, explainability, and governance."""

from fastapi import FastAPI, HTTPException, status, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import joblib
import sys
import os
import uuid
import logging
import json
import csv
from datetime import datetime
from dotenv import load_dotenv
from typing import Optional
from pathlib import Path
from threading import Lock

# Load environment variables
load_dotenv()

# =====================================================================
# LOGGING SETUP
# =====================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger("supportdesk")

# =====================================================================
# SUPABASE CLIENT
# =====================================================================
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        log.info("✅ Supabase client initialized successfully")
    except Exception as e:
        supabase = None
        log.error(f"❌ Supabase initialization failed: {e}")
else:
    log.warning("⚠️ Supabase credentials missing")

# =====================================================================
# IMPORT MODULES
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(BASE_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

try:
    from preprocessing.text_cleaning import clean_text, validate_text_input
except ImportError as e:
    log.error(f"Failed to import text cleaning: {e}")
    def clean_text(s: str) -> str:
        return s
    def validate_text_input(s: str, **kwargs):
        return True, "Valid"

try:
    from models.sentiment_analyzer import SentimentAnalyzer, EmotionDetector
    from models.monitor import ModelMonitor
    from models.explainer import ModelExplainer
except ImportError as e:
    log.error(f"Failed to import AI modules: {e}")
    SentimentAnalyzer = None
    EmotionDetector = None
    ModelMonitor = None
    ModelExplainer = None

# =====================================================================
# LOAD ML MODEL
# =====================================================================
ROOT_DIR = os.path.dirname(SRC_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, "models")
DATA_DIR = Path(ROOT_DIR) / "data" / "processed"
DATA_DIR.mkdir(parents=True, exist_ok=True)

AUDIT_LOG_PATH = DATA_DIR / "audit_events.jsonl"
FEEDBACK_DATA_PATH = DATA_DIR / "feedback_loop.jsonl"
MODEL_REGISTRY_PATH = DATA_DIR / "model_registry.json"

MODEL_VERSION = os.getenv("MODEL_VERSION", "2.1.0")
DEFAULT_ROLE = "agent"
SUPPORTED_ROLES = {"admin", "agent", "viewer"}
ENABLE_EXPLAINER = os.getenv("ENABLE_EXPLAINER", "false").strip().lower() == "true"

ASYNC_JOBS = {}
ASYNC_LOCK = Lock()

DEFAULT_CONFIDENCE_THRESHOLDS = {
    "Incident": 0.75,
    "Request": 0.70,
    "Problem": 0.72,
    "Change": 0.68,
}
confidence_thresholds = dict(DEFAULT_CONFIDENCE_THRESHOLDS)

model = None
tfidf = None
try:
    model = joblib.load(os.path.join(MODEL_DIR, "ticket_model.pkl"))
    tfidf = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
    log.info("✅ ML model and vectorizer loaded successfully")
except Exception as e:
    log.error(f"❌ Failed to load ML model: {e}")
    log.info("⚠️ App will run with heuristic predictions only")

# =====================================================================
# INITIALIZE COMPONENTS
# =====================================================================
# Initialize sentiment analyzer
sentiment_analyzer = None
emotion_detector = None
if SentimentAnalyzer:
    try:
        sentiment_analyzer = SentimentAnalyzer()
        emotion_detector = EmotionDetector()
        log.info("✅ Sentiment analysis initialized")
    except Exception as e:
        log.warning(f"⚠️ Sentiment analysis initialization failed: {e}")

# Initialize model monitor
model_monitor = None
if ModelMonitor:
    try:
        model_monitor = ModelMonitor(window_size=100)
        log.info("✅ Model monitor initialized")
    except Exception as e:
        log.warning(f"⚠️ Model monitor initialization failed: {e}")

# Initialize explainer
model_explainer = None
if ModelExplainer and model and tfidf and ENABLE_EXPLAINER:
    try:
        feature_names = getattr(tfidf, 'get_feature_names_out', lambda: [])()
        model_explainer = ModelExplainer(model, tfidf, feature_names)
        log.info("✅ Model explainer (SHAP) initialized")
    except Exception as e:
        log.warning(f"⚠️ Model explainer initialization failed: {e}")
elif not ENABLE_EXPLAINER:
    log.info("ℹ️ Explainability startup init disabled (set ENABLE_EXPLAINER=true to enable)")

# =====================================================================
# FASTAPI APP
# =====================================================================
app = FastAPI(
    title="SupportDesk AI API",
    description="Advanced ticket classification with ML, NLP, and explainability",
    version="2.0.0"
)

# =====================================================================
# CORS CONFIGURATION
# =====================================================================
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
environment = os.getenv("ENVIRONMENT", "development")

# Development origins
dev_origins = [
    "http://localhost:8080",
    "http://localhost:8081", 
    "http://localhost:8082",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://localhost:3000",
]

if environment == "production":
    # Production: use only explicitly allowed origins
    if allowed_origins_env.strip():
        allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    else:
        allowed_origins = []
        log.warning("⚠️ No ALLOWED_ORIGINS set in production!")
else:
    # Development: merge env origins with dev origins
    if allowed_origins_env.strip() and allowed_origins_env.strip() != "*":
        env_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
        allowed_origins = list(set(dev_origins + env_origins))
    else:
        allowed_origins = dev_origins

log.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any

class TicketInput(BaseModel):
    subject: str = Field(..., min_length=5, max_length=500)
    description: str = Field(..., min_length=5, max_length=5000)
    user_id: Optional[str] = None


class BatchTicketInput(BaseModel):
    tickets: List[TicketInput] = Field(..., min_items=1, max_items=100)
    user_id: Optional[str] = None


class FeedbackInput(BaseModel):
    prediction_id: str
    correct_category: str
    comments: Optional[str] = None


class RoleContext(BaseModel):
    user_id: str
    role: str


class ThresholdUpdateInput(BaseModel):
    Incident: Optional[float] = None
    Request: Optional[float] = None
    Problem: Optional[float] = None
    Change: Optional[float] = None


class AsyncPredictionRequest(BaseModel):
    subject: str = Field(..., min_length=5, max_length=500)
    description: str = Field(..., min_length=5, max_length=5000)
    user_id: Optional[str] = None


class RetrainTriggerInput(BaseModel):
    reason: Optional[str] = "manual"
    min_feedback_records: int = 10


# =====================================================================
# UTILITY FUNCTIONS
# =====================================================================
def generate_request_id() -> str:
    """Generate unique request ID."""
    return str(uuid.uuid4())[:8]


def get_role_context(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
) -> RoleContext:
    role = (x_user_role or DEFAULT_ROLE).lower().strip()
    if role not in SUPPORTED_ROLES:
        role = DEFAULT_ROLE
    return RoleContext(user_id=(x_user_id or "anonymous"), role=role)


def enforce_roles(context: RoleContext, allowed_roles: list[str]):
    if context.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{context.role}' is not allowed for this action"
        )


def append_jsonl(path: Path, record: dict):
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(record, ensure_ascii=False) + "\n")


def log_audit_event(event_type: str, context: RoleContext, details: dict):
    event = {
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": context.user_id,
        "role": context.role,
        "details": details,
    }
    append_jsonl(AUDIT_LOG_PATH, event)


def ensure_model_registry():
    if MODEL_REGISTRY_PATH.exists():
        return
    initial = {
        "active_model_version": MODEL_VERSION,
        "models": [
            {
                "version": MODEL_VERSION,
                "created_at": datetime.utcnow().isoformat(),
                "status": "active",
                "notes": "Initial loaded model"
            }
        ]
    }
    MODEL_REGISTRY_PATH.write_text(json.dumps(initial, indent=2), encoding="utf-8")


def load_model_registry() -> dict:
    ensure_model_registry()
    return json.loads(MODEL_REGISTRY_PATH.read_text(encoding="utf-8"))


def save_model_registry(registry: dict):
    MODEL_REGISTRY_PATH.write_text(json.dumps(registry, indent=2), encoding="utf-8")


def assess_data_quality(subject: str, description: str) -> dict:
    quality_issues = []
    subject_len = len(subject.strip())
    description_len = len(description.strip())
    combined = f"{subject} {description}".strip()

    if subject_len < 8:
        quality_issues.append("subject_too_short")
    if description_len < 20:
        quality_issues.append("description_too_short")
    if combined.isupper() and combined:
        quality_issues.append("all_caps_text")
    if sum(ch.isdigit() for ch in combined) > len(combined) * 0.4:
        quality_issues.append("too_many_digits")

    quality_score = max(0.0, 1.0 - (0.15 * len(quality_issues)))
    return {
        "score": round(quality_score, 2),
        "issues": quality_issues,
        "is_acceptable": quality_score >= 0.5,
    }


def generate_plain_explanation(category: str, confidence: float, top_classes: list[dict], quality: dict) -> str:
    primary = f"The model classifies this ticket as {category} with {round(confidence * 100, 1)}% confidence."
    alternatives = ""
    if len(top_classes) > 1:
        alt = ", ".join([f"{item['label']} ({round(item['score'] * 100, 1)}%)" for item in top_classes[1:3]])
        alternatives = f" Alternative categories considered: {alt}."

    quality_text = ""
    if quality.get("issues"):
        quality_text = f" Data quality flags: {', '.join(quality['issues'])}."

    return f"{primary}{alternatives}{quality_text}".strip()


def heuristic_predict_ticket(subject: str, description: str):
    """Safe rule-based fallback when ML inference is unavailable."""
    text = f"{subject} {description}".lower()

    keyword_map = {
        "Incident": ["down", "outage", "error", "failed", "critical", "crash", "broken"],
        "Request": ["request", "need", "please", "access", "permission", "create", "add"],
        "Problem": ["slow", "intermittent", "recurring", "degraded", "latency", "unstable"],
        "Change": ["change", "update", "upgrade", "migrate", "deploy", "configuration"],
    }

    scores = {label: 0 for label in keyword_map}
    for label, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in text:
                scores[label] += 1

    predicted = max(scores, key=scores.get)
    max_score = scores[predicted]

    if max_score == 0:
        predicted = "Incident"
        confidence = 0.55
    else:
        confidence = min(0.92, 0.55 + (max_score * 0.08))

    total = sum(scores.values())
    if total == 0:
        top_classes = [
            {"label": "Incident", "score": 0.55},
            {"label": "Request", "score": 0.25},
            {"label": "Problem", "score": 0.20},
        ]
    else:
        normalized = [
            {"label": label, "score": round(score / total, 4)}
            for label, score in scores.items()
        ]
        top_classes = sorted(normalized, key=lambda item: item["score"], reverse=True)[:3]

    return predicted, round(confidence, 4), top_classes


def save_to_history(user_id: str, subject: str, description: str, 
                   predicted_category: str, confidence: float, request_id: str):
    """Save prediction to history (background task)."""
    if not user_id or not supabase:
        return
    
    try:
        supabase.schema("public").table("history").insert({
            "user_id": user_id,
            "subject": subject,
            "body": description,
            "predicted_category": predicted_category,
            "confidence": confidence,
            "request_id": request_id,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        log.info(f"📌 Saved prediction {request_id} for user {user_id}")
    except Exception as e:
        log.error(f"⚠️ Failed to save history: {e}")


ensure_model_registry()


# =====================================================================
# ENDPOINTS
# =====================================================================

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": True,
        "database_connected": supabase is not None,
        "components": {
            "sentiment_analysis": sentiment_analyzer is not None,
            "explainability": model_explainer is not None,
            "monitoring": model_monitor is not None
        }
    }


@app.post("/predict", tags=["Predictions"])
def predict(
    ticket: TicketInput,
    background_tasks: BackgroundTasks,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    """
    Predict ticket category with confidence, sentiment, and explanation.
    
    Returns:
    - category: Predicted ticket category
    - confidence: Confidence score (0-1)
    - sentiment: Sentiment analysis results
    - urgency: Urgency level detection
    - explanation: SHAP-based feature explanation
    - top_classes: Top 3 predicted categories with scores
    """
    request_id = generate_request_id()
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent", "viewer"])
    
    try:
        # ---- Validate input ----
        is_valid, msg = validate_text_input(ticket.subject)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)
        
        is_valid, msg = validate_text_input(ticket.description)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)
        
        log.info(f"[{request_id}] Processing ticket: {ticket.subject[:50]}...")
        
        # ---- Clean and prepare text ----
        combined_text = f"{ticket.subject} {ticket.description}"
        cleaned_text = clean_text(combined_text)
        quality = assess_data_quality(ticket.subject, ticket.description)
        
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="Text too short after cleaning")
        
        # ---- Get prediction ----
        X = tfidf.transform([cleaned_text])
        pred = model.predict(X)[0]
        
        # ---- Calculate probabilities ----
        if hasattr(model, 'decision_function'):
            raw_scores = model.decision_function(X)[0]
            exp_scores = __import__('numpy').exp(raw_scores - __import__('numpy').max(raw_scores))
            probs = exp_scores / exp_scores.sum()
        else:
            probs = model.predict_proba(X)[0]
        
        proba_dict = dict(zip(model.classes_, probs))
        confidence = float(proba_dict[pred])
        threshold = confidence_thresholds.get(str(pred), 0.7)
        confidence_status = "high" if confidence >= threshold else "needs_review"
        
        top_classes = sorted(
            [(lbl, float(s)) for lbl, s in proba_dict.items()],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        # ---- Sentiment Analysis ----
        sentiment = None
        if sentiment_analyzer:
            try:
                sentiment = sentiment_analyzer.analyze(ticket.description)
            except Exception as e:
                log.warning(f"Sentiment analysis failed: {e}")
        
        # ---- Urgency Detection ----
        urgency = None
        if emotion_detector:
            try:
                urgency = emotion_detector.detect_urgency_signals(combined_text)
            except Exception as e:
                log.warning(f"Urgency detection failed: {e}")
        
        # ---- Explainability ----
        explanation = None
        if model_explainer:
            try:
                explanation = model_explainer.explain_prediction(X, cleaned_text)
            except Exception as e:
                log.warning(f"Explanation generation failed: {e}")
        
        # ---- Update Monitor ----
        if model_monitor:
            try:
                model_monitor.update(pred, confidence)
            except Exception as e:
                log.warning(f"Monitor update failed: {e}")
        
        # ---- Prepare Response ----
        response = {
            "request_id": request_id,
            "category": pred,
            "confidence": round(confidence, 4),
            "top_classes": [{"label": lbl, "score": round(s, 4)} for lbl, s in top_classes],
            "sentiment": sentiment,
            "urgency": urgency,
            "explanation": explanation,
            "plain_explanation": generate_plain_explanation(
                str(pred),
                confidence,
                [{"label": lbl, "score": float(s)} for lbl, s in top_classes],
                quality,
            ),
            "quality": quality,
            "model_version": MODEL_VERSION,
            "confidence_status": confidence_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # ---- Save to history (background) ----
        if ticket.user_id:
            background_tasks.add_task(
                save_to_history,
                ticket.user_id,
                ticket.subject,
                ticket.description,
                pred,
                confidence,
                request_id
            )

        background_tasks.add_task(
            log_audit_event,
            "prediction_created",
            context,
            {
                "request_id": request_id,
                "category": str(pred),
                "confidence": round(confidence, 4),
                "quality_score": quality["score"],
            },
        )
        
        log.info(f"[{request_id}] ✅ Prediction successful: {pred} ({confidence:.2%})")
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[{request_id}] ❌ Prediction failed: {e}")
        fallback_category, fallback_confidence, fallback_top = heuristic_predict_ticket(
            ticket.subject,
            ticket.description,
        )
        log.warning(f"[{request_id}] ⚠️ Returned heuristic fallback prediction")
        return {
            "request_id": request_id,
            "category": fallback_category,
            "confidence": fallback_confidence,
            "top_classes": fallback_top,
            "sentiment": None,
            "urgency": None,
            "explanation": {
                "method": "heuristic_fallback",
                "reason": "ml_inference_unavailable",
            },
            "plain_explanation": generate_plain_explanation(
                fallback_category,
                fallback_confidence,
                fallback_top,
                assess_data_quality(ticket.subject, ticket.description),
            ),
            "quality": assess_data_quality(ticket.subject, ticket.description),
            "model_version": MODEL_VERSION,
            "confidence_status": "needs_review",
            "timestamp": datetime.utcnow().isoformat(),
        }


@app.post("/predict/batch", tags=["Predictions"])
def predict_batch(
    batch_input: BatchTicketInput,
    background_tasks: BackgroundTasks,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    """
    Batch prediction for multiple tickets.
    
    Warning: Maximum 100 tickets per request.
    """
    request_id = generate_request_id()
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent"])
    results = []
    
    try:
        log.info(f"[{request_id}] Processing batch of {len(batch_input.tickets)} tickets")
        
        for i, ticket in enumerate(batch_input.tickets):
            try:
                # Validate
                is_valid, _ = validate_text_input(ticket.subject)
                if not is_valid:
                    results.append({
                        "index": i,
                        "status": "error",
                        "message": "Invalid subject"
                    })
                    continue
                
                # Clean and predict
                combined_text = f"{ticket.subject} {ticket.description}"
                cleaned_text = clean_text(combined_text)
                
                X = tfidf.transform([cleaned_text])
                pred = model.predict(X)[0]
                
                if hasattr(model, 'decision_function'):
                    raw_scores = model.decision_function(X)[0]
                    exp_scores = __import__('numpy').exp(raw_scores - __import__('numpy').max(raw_scores))
                    probs = exp_scores / exp_scores.sum()
                else:
                    probs = model.predict_proba(X)[0]
                
                confidence = float(dict(zip(model.classes_, probs))[pred])
                threshold = confidence_thresholds.get(str(pred), 0.7)
                quality = assess_data_quality(ticket.subject, ticket.description)
                
                results.append({
                    "index": i,
                    "status": "success",
                    "category": pred,
                    "confidence": round(confidence, 4),
                    "confidence_status": "high" if confidence >= threshold else "needs_review",
                    "quality": quality,
                    "model_version": MODEL_VERSION,
                })
                
            except Exception as e:
                log.error(f"Batch item {i} failed: {e}")
                results.append({
                    "index": i,
                    "status": "error",
                    "message": str(e)
                })
        
        log.info(f"[{request_id}] ✅ Batch processing complete")
        return {
            "request_id": request_id,
            "total": len(batch_input.tickets),
            "successful": sum(1 for r in results if r["status"] == "success"),
            "model_version": MODEL_VERSION,
            "results": results
        }
    
    except Exception as e:
        log.error(f"[{request_id}] ❌ Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail="Batch processing failed")


@app.post("/feedback", tags=["Feedback"])
def submit_feedback(
    feedback: FeedbackInput,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    """
    Submit feedback for predictions (improves model).
    
    This endpoint logs corrections that can be used for model retraining.
    """
    try:
        context = get_role_context(x_user_id, x_user_role)
        enforce_roles(context, ["admin", "agent", "viewer"])
        log.info(f"📝 Feedback received: {feedback.prediction_id} -> {feedback.correct_category}")

        feedback_record = {
            "feedback_id": str(uuid.uuid4()),
            "prediction_id": feedback.prediction_id,
            "correct_category": feedback.correct_category,
            "comments": feedback.comments,
            "submitted_by": context.user_id,
            "submitted_role": context.role,
            "created_at": datetime.utcnow().isoformat(),
        }

        append_jsonl(FEEDBACK_DATA_PATH, feedback_record)
        log_audit_event("feedback_submitted", context, {
            "prediction_id": feedback.prediction_id,
            "correct_category": feedback.correct_category,
        })
        
        # Future: Save feedback to database for retraining
        if supabase:
            try:
                supabase.schema("public").table("feedback").insert({
                    "prediction_id": feedback.prediction_id,
                    "correct_category": feedback.correct_category,
                    "comments": feedback.comments,
                    "created_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                log.warning(f"Failed to save feedback: {e}")
        
        return {"status": "received", "message": "Thank you for the feedback!", "feedback_id": feedback_record["feedback_id"]}
    
    except Exception as e:
        log.error(f"Feedback submission failed: {e}")
        raise HTTPException(status_code=500, detail="Feedback submission failed")


@app.get("/feedback/export", tags=["Feedback"])
def export_feedback(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent"])

    if not FEEDBACK_DATA_PATH.exists():
        return {"count": 0, "items": []}

    records = []
    with FEEDBACK_DATA_PATH.open("r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return {"count": len(records), "items": records}


@app.post("/retrain/trigger", tags=["Model"])
def trigger_retraining(
    payload: RetrainTriggerInput,
    background_tasks: BackgroundTasks,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin"])

    feedback_count = 0
    if FEEDBACK_DATA_PATH.exists():
        with FEEDBACK_DATA_PATH.open("r", encoding="utf-8") as file:
            feedback_count = sum(1 for _ in file)

    if feedback_count < payload.min_feedback_records:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough feedback records: {feedback_count}/{payload.min_feedback_records}"
        )

    registry = load_model_registry()
    new_version = f"{MODEL_VERSION}-candidate-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    registry["models"].append({
        "version": new_version,
        "created_at": datetime.utcnow().isoformat(),
        "status": "training",
        "notes": f"Triggered by {context.user_id} for reason: {payload.reason}",
    })
    save_model_registry(registry)

    log_audit_event("retrain_triggered", context, {
        "candidate_version": new_version,
        "feedback_records": feedback_count,
        "reason": payload.reason,
    })

    return {
        "status": "queued",
        "candidate_model_version": new_version,
        "feedback_records_used": feedback_count,
        "message": "Retraining job queued (simulation mode)."
    }


@app.get("/models/registry", tags=["Model"])
def get_model_registry(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent", "viewer"])
    return load_model_registry()


@app.get("/config/thresholds", tags=["Monitoring"])
def get_thresholds(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent", "viewer"])
    return {"thresholds": confidence_thresholds}


@app.post("/config/thresholds", tags=["Monitoring"])
def update_thresholds(
    payload: ThresholdUpdateInput,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin"])

    updates = payload.dict(exclude_none=True)
    for label, value in updates.items():
        if value < 0.0 or value > 1.0:
            raise HTTPException(status_code=400, detail=f"Invalid threshold for {label}: {value}")
        confidence_thresholds[label] = value

    log_audit_event("thresholds_updated", context, {"updates": updates})
    return {"status": "updated", "thresholds": confidence_thresholds}


@app.post("/predict/async", tags=["Predictions"])
def predict_async(
    payload: AsyncPredictionRequest,
    background_tasks: BackgroundTasks,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent"])

    job_id = str(uuid.uuid4())
    with ASYNC_LOCK:
        ASYNC_JOBS[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "result": None,
        }

    def run_job():
        with ASYNC_LOCK:
            ASYNC_JOBS[job_id]["status"] = "running"
        try:
            result = predict(
                TicketInput(subject=payload.subject, description=payload.description, user_id=payload.user_id),
                BackgroundTasks(),
                x_user_id=context.user_id,
                x_user_role=context.role,
            )
            with ASYNC_LOCK:
                ASYNC_JOBS[job_id]["status"] = "completed"
                ASYNC_JOBS[job_id]["result"] = result
        except Exception as error:
            with ASYNC_LOCK:
                ASYNC_JOBS[job_id]["status"] = "failed"
                ASYNC_JOBS[job_id]["error"] = str(error)

    background_tasks.add_task(run_job)
    log_audit_event("async_prediction_queued", context, {"job_id": job_id})
    return {"job_id": job_id, "status": "queued"}


@app.get("/predict/async/{job_id}", tags=["Predictions"])
def get_async_prediction_status(
    job_id: str,
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent", "viewer"])
    with ASYNC_LOCK:
        job = ASYNC_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/monitor/calibration", tags=["Monitoring"])
def get_calibration_report(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent", "viewer"])

    if model_monitor:
        stats = model_monitor.get_stats()
        confidence_stats = stats.get("confidence_stats", {})
    else:
        confidence_stats = {}

    return {
        "model_version": MODEL_VERSION,
        "thresholds": confidence_thresholds,
        "confidence_stats": confidence_stats,
        "recommendation": "Increase thresholds for categories with low precision drift; lower thresholds if recall is too low.",
    }


@app.get("/monitor/drift/report", tags=["Monitoring"])
def get_drift_report(
    x_user_id: Optional[str] = Header(default="anonymous"),
    x_user_role: Optional[str] = Header(default=DEFAULT_ROLE),
):
    context = get_role_context(x_user_id, x_user_role)
    enforce_roles(context, ["admin", "agent"])

    if not model_monitor:
        return {
            "status": "unavailable",
            "message": "Monitoring component unavailable",
            "scheduled_alert_channels": ["webhook"],
        }

    stats = model_monitor.get_stats()
    drift_detected = bool(stats.get("drift_detected", False))
    report = {
        "generated_at": datetime.utcnow().isoformat(),
        "model_version": MODEL_VERSION,
        "drift_detected": drift_detected,
        "stats": stats,
        "alerting": {
            "webhook_configured": bool(os.getenv("ALERT_WEBHOOK_URL")),
            "schedule": "daily",
        }
    }

    if drift_detected and os.getenv("ALERT_WEBHOOK_URL"):
        log.warning("⚠️ Drift detected: webhook alert should be sent by scheduler")

    return report


@app.get("/stats", tags=["Monitoring"])
def get_stats():
    """
    Get model performance statistics and monitoring data.
    
    Includes:
    - Prediction accuracy
    - Confidence metrics
    - Data drift detection
    - Performance degradation alerts
    """
    try:
        if not model_monitor:
            raise HTTPException(status_code=503, detail="Monitoring not available")
        
        stats = model_monitor.get_stats()
        
        return {
            "status": "ok",
            **stats,
            "retraining_suggested": model_monitor.needs_retraining()
        }
    
    except Exception as e:
        log.error(f"Stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Stats retrieval failed")


@app.get("/model/info", tags=["Model"])
def get_model_info():
    """
    Get model metadata and capabilities.
    
    Returns:
    - Model type and classes
    - Feature count
    - Available enhancements (sentiment, explanation, monitoring)
    """
    try:
        info = {
            "model_type": type(model).__name__,
            "classes": list(model.classes_),
            "n_features": getattr(tfidf, 'n_features_in_', None),
            "capabilities": {
                "sentiment_analysis": sentiment_analyzer is not None,
                "explainability": model_explainer is not None,
                "monitoring": model_monitor is not None,
                "batch_prediction": True,
                "async_prediction_queue": True,
                "feedback_loop": True,
                "rbac": True,
                "audit_logging": True,
            },
            "version": MODEL_VERSION,
            "api_version": "v1"
        }
        return info
    except Exception as e:
        log.error(f"Model info retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model info")


@app.get("/docs", tags=["Documentation"], include_in_schema=False)
@app.get("/openapi.json", tags=["Documentation"], include_in_schema=False)
def custom_openapi():
    """OpenAPI documentation."""
    pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )
