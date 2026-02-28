"""Model monitoring and drift detection."""

import logging
import numpy as np
from datetime import datetime
from collections import deque
from typing import Any

log = logging.getLogger(__name__)


class ModelMonitor:
    """
    Monitor model performance and detect data drift.
    Tracks predictions, accuracy, and data distribution changes.
    """
    
    def __init__(self, window_size: int = 100, drift_threshold: float = 0.1):
        """
        Initialize model monitor.
        
        Args:
            window_size: Number of recent predictions to track
            drift_threshold: Threshold for drift detection (0-1)
        """
        self.window_size = window_size
        self.drift_threshold = drift_threshold
        
        # Track recent predictions
        self.predictions = deque(maxlen=window_size)
        self.confidences = deque(maxlen=window_size)
        self.true_labels = deque(maxlen=window_size)
        
        # Statistics
        self.stats = {
            "total_predictions": 0,
            "avg_confidence": 0.0,
            "low_confidence_count": 0,
            "drift_detected": False,
            "last_updated": None
        }
    
    def update(self, prediction: str, confidence: float, true_label: str = None):
        """
        Update monitor with new prediction.
        
        Args:
            prediction: Model's predicted label
            confidence: Confidence score (0-1)
            true_label: Actual label (optional, for feedback)
        """
        self.predictions.append(prediction)
        self.confidences.append(confidence)
        
        if true_label:
            self.true_labels.append(true_label)
        
        self.stats["total_predictions"] += 1
        self.stats["avg_confidence"] = np.mean(list(self.confidences))
        self.stats["last_updated"] = datetime.now().isoformat()
        
        # Track low confidence predictions
        if confidence < 0.5:
            self.stats["low_confidence_count"] += 1
        
        # Check for drift
        self._check_drift()
    
    def _check_drift(self):
        """
        Detect potential data or concept drift.
        Checks for changes in prediction distribution and confidence.
        """
        if len(self.confidences) < 20:  # Need minimum samples
            return
        
        # Get recent window
        recent_conf = list(self.confidences)[-20:]
        
        # High variance in confidence or many low-confidence predictions indicates drift
        conf_std = np.std(recent_conf)
        low_conf_rate = sum(1 for c in recent_conf if c < 0.5) / len(recent_conf)
        
        if conf_std > 0.3 or low_conf_rate > self.drift_threshold:
            self.stats["drift_detected"] = True
            log.warning(f"⚠️ Data drift detected! Std: {conf_std:.3f}, Low-conf rate: {low_conf_rate:.1%}")
        else:
            self.stats["drift_detected"] = False
    
    def get_accuracy(self) -> float:
        """Calculate accuracy from tracked true labels."""
        if not self.true_labels or len(self.true_labels) == 0:
            return None
        
        correct = sum(
            1 for pred, true in zip(self.predictions, self.true_labels)
            if pred == true
        )
        return correct / len(self.true_labels)
    
    def get_stats(self) -> dict:
        """Get comprehensive monitoring statistics."""
        return {
            **self.stats,
            "accuracy": self.get_accuracy(),
            "recent_prediction_distribution": self._get_distribution(),
            "confidence_range": {
                "min": float(np.min(list(self.confidences))) if self.confidences else 0,
                "max": float(np.max(list(self.confidences))) if self.confidences else 0,
                "mean": self.stats["avg_confidence"],
                "std": float(np.std(list(self.confidences))) if len(self.confidences) > 1 else 0
            }
        }
    
    def _get_distribution(self) -> dict:
        """Get distribution of recent predictions."""
        if not self.predictions:
            return {}
        
        dist = {}
        for pred in self.predictions:
            dist[pred] = dist.get(pred, 0) + 1
        
        return {k: v / len(self.predictions) for k, v in dist.items()}
    
    def needs_retraining(self) -> bool:
        """
        Determine if model needs retraining based on monitoring data.
        
        Returns:
            True if retraining is recommended
        """
        if not self.stats:
            return False
        
        # Suggest retraining if:
        # 1. Drift is detected
        # 2. Average confidence drops significantly
        # 3. Too many low-confidence predictions
        
        needs_retrain = (
            self.stats["drift_detected"] or
            self.stats["avg_confidence"] < 0.6 or
            self.stats["low_confidence_count"] > len(self.predictions) * 0.3
        )
        
        return needs_retrain


class ConfidenceCalibrator:
    """
    Calibrate and improve confidence scores using temperature scaling.
    """
    
    def __init__(self, temperature: float = 1.0):
        """
        Initialize calibrator.
        
        Args:
            temperature: Temperature scaling parameter (default 1.0 = no scaling)
        """
        self.temperature = temperature
    
    def calibrate_confidence(self, raw_scores: np.ndarray) -> np.ndarray:
        """
        Apply temperature scaling to confidence scores.
        
        Args:
            raw_scores: Raw model scores
            
        Returns:
            Calibrated probability scores
        """
        try:
            # Apply temperature scaling
            scaled = raw_scores / self.temperature
            
            # Softmax normalization
            exp_scaled = np.exp(scaled - np.max(scaled))
            probs = exp_scaled / np.sum(exp_scaled)
            
            return probs
        except Exception as e:
            log.error(f"Calibration failed: {e}")
            return raw_scores
