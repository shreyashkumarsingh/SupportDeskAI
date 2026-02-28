"""Ticket Classifier with extended functionality."""

import joblib
import numpy as np
import logging
from typing import Tuple, Optional, Dict, Any

log = logging.getLogger(__name__)


class TicketClassifier:
    """
    Advanced ticket classifier with confidence scoring, explainability, and monitoring.
    """
    
    def __init__(self, vectorizer, model):
        """
        Initialize classifier.
        
        Args:
            vectorizer: TF-IDF vectorizer
            model: Trained SVM or similar classifier
        """
        self.vectorizer = vectorizer
        self.model = model
        self.feature_names = getattr(vectorizer, 'get_feature_names_out', lambda: [])()
        
        # Initialize optional components
        self.explainer = None
        self.sentiment_analyzer = None
        self.monitor = None
        
        log.info("✅ TicketClassifier initialized")
    
    def predict(self, text: str) -> Tuple[str, Dict[str, Any]]:
        """
        Make prediction with confidence and explanation.
        
        Args:
            text: Cleaned ticket text
            
        Returns:
            Tuple of (prediction: str, details: dict)
        """
        try:
            # Vectorize text
            X = self.vectorizer.transform([text])
            
            # Get prediction
            pred = self.model.predict(X)[0]
            
            # Get probabilities
            proba = self._get_probabilities(X)
            confidence = proba.get(pred, 0.0)
            
            # Get top predictions
            top_classes = sorted(proba.items(), key=lambda x: x[1], reverse=True)[:3]
            
            details = {
                "category": pred,
                "confidence": round(confidence, 4),
                "top_classes": [
                    {"label": label, "score": round(score, 4)}
                    for label, score in top_classes
                ],
                "raw_scores": None,
                "explanation": None
            }
            
            # Add explanation if available
            if self.explainer:
                details["explanation"] = self.explainer.explain_prediction(X, text)
            
            # Update monitoring
            if self.monitor:
                self.monitor.update(pred, confidence)
            
            return pred, details
        
        except Exception as e:
            log.error(f"❌ Prediction failed: {e}")
            raise
    
    def predict_batch(self, texts: list) -> list:
        """
        Make predictions for multiple texts.
        
        Args:
            texts: List of ticket texts
            
        Returns:
            List of predictions
        """
        try:
            X = self.vectorizer.transform(texts)
            predictions = self.model.predict(X)
            
            results = []
            for i, pred in enumerate(predictions):
                proba = self._get_probabilities(X[i:i+1])
                confidence = proba.get(pred, 0.0)
                results.append({
                    "text": texts[i],
                    "category": pred,
                    "confidence": round(confidence, 4)
                })
            
            return results
        
        except Exception as e:
            log.error(f"❌ Batch prediction failed: {e}")
            raise
    
    def _get_probabilities(self, X) -> Dict[str, float]:
        """
        Get class probabilities from model decision function.
        
        Args:
            X: Vectorized features
            
        Returns:
            Dictionary of class -> probability
        """
        try:
            # Get decision function scores
            if hasattr(self.model, 'decision_function'):
                raw_scores = self.model.decision_function(X)[0]
            else:
                raw_scores = self.model.predict_proba(X)[0]
            
            # Convert to probabilities using softmax
            exp_scores = np.exp(raw_scores - np.max(raw_scores))
            probs = exp_scores / exp_scores.sum()
            
            return dict(zip(self.model.classes_, probs))
        
        except Exception as e:
            log.warning(f"⚠️ Probability calculation fell back to default: {e}")
            pred = self.model.predict(X)[0]
            return {pred: 1.0}
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata and capabilities."""
        return {
            "model_type": type(self.model).__name__,
            "classes": list(self.model.classes_),
            "n_features": self.vectorizer.n_features_in_ if hasattr(self.vectorizer, 'n_features_in_') else 0,
            "has_explanation": self.explainer is not None,
            "has_sentiment": self.sentiment_analyzer is not None,
            "has_monitoring": self.monitor is not None
        }

