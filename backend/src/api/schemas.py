"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum


class TicketInput(BaseModel):
    """Ticket input for prediction."""
    subject: str = Field(..., min_length=5, max_length=500, description="Ticket subject")
    description: str = Field(..., min_length=5, max_length=5000, description="Ticket description")
    user_id: Optional[str] = Field(None, description="User ID for tracking")
    
    @validator('subject', 'description', pre=True)
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class BatchPredictionInput(BaseModel):
    """Batch prediction request."""
    tickets: List[TicketInput] = Field(..., min_items=1, max_items=100)
    user_id: Optional[str] = None


class PredictionResponse(BaseModel):
    """Prediction response with explanation and metadata."""
    category: str
    confidence: float
    top_classes: List[Dict[str, float]]
    sentiment: Optional[Dict[str, Any]] = None
    urgency: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


class FeedbackInput(BaseModel):
    """Feedback for model improvement."""
    prediction_id: str
    correct_category: str
    confidence_feedback: Optional[str] = Field(None, description="'too_high' or 'too_low'")
    comments: Optional[str] = Field(None, max_length=500)


class ModelStatsResponse(BaseModel):
    """Model performance statistics."""
    total_predictions: int
    avg_confidence: float
    low_confidence_count: int
    drift_detected: bool
    accuracy: Optional[float] = None
    recent_distribution: Dict[str, float]
    last_updated: Optional[str] = None


class ModelInfoResponse(BaseModel):
    """Model metadata and capabilities."""
    model_type: str
    classes: List[str]
    n_features: int
    capabilities: Dict[str, bool]
    version: str = "1.0.0"


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    model_loaded: bool
    database_connected: Optional[bool] = None
    message: str = "Service is operational"
