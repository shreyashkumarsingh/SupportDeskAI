"""Model explainability using SHAP."""

import shap
import logging
import numpy as np
from typing import Any

log = logging.getLogger(__name__)


class ModelExplainer:
    """
    Provides feature importance and prediction explanations using SHAP.
    """
    
    def __init__(self, model: Any, vectorizer: Any, feature_names: list = None):
        """
        Initialize the SHAP explainer.
        
        Args:
            model: Trained classifier model
            vectorizer: TF-IDF vectorizer
            feature_names: List of feature names (TF-IDF terms)
        """
        self.model = model
        self.vectorizer = vectorizer
        self.feature_names = feature_names or [f"feature_{i}" for i in range(1000)]
        
        try:
            # Create SHAP explainer for linear models
            self.explainer = shap.LinearExplainer(
                model,
                data=np.zeros((1, len(self.feature_names))),
                feature_names=self.feature_names
            )
            log.info("✅ SHAP explainer initialized successfully")
        except Exception as e:
            log.warning(f"⚠️ SHAP initialization warning: {e}")
            self.explainer = None
    
    def explain_prediction(self, text_features: np.ndarray, text: str = "") -> dict:
        """
        Explain a single prediction using SHAP.
        
        Args:
            text_features: TF-IDF transformed features (sparse matrix or array)
            text: Original text (for context)
            
        Returns:
            Dict with feature importance and top contributing features
        """
        if self.explainer is None:
            return {
                "explanation": "SHAP unavailable",
                "top_features": []
            }
        
        try:
            # Convert sparse matrix to dense if needed
            if hasattr(text_features, 'toarray'):
                features_dense = text_features.toarray()
            else:
                features_dense = text_features
            
            # Get SHAP values
            shap_values = self.explainer.shap_values(features_dense)
            
            # Handle multi-class (shap_values might be a list)
            if isinstance(shap_values, list):
                shap_values = shap_values[0]  # Use first class for now
            
            # Get feature importance
            feature_importance = np.abs(shap_values[0])
            top_indices = np.argsort(feature_importance)[-10:][::-1]  # Top 10 features
            
            top_features = [
                {
                    "feature": self.feature_names[idx] if idx < len(self.feature_names) else f"feature_{idx}",
                    "importance": float(feature_importance[idx]),
                    "value": float(features_dense[0, idx]) if idx < features_dense.shape[1] else 0.0
                }
                for idx in top_indices if feature_importance[idx] > 0
            ]
            
            return {
                "explanation": "Top contributing features for this prediction",
                "top_features": top_features,
                "total_importance": float(np.sum(feature_importance))
            }
        
        except Exception as e:
            log.error(f"SHAP explanation failed: {e}")
            return {
                "explanation": f"Explanation generation failed: {str(e)}",
                "top_features": []
            }
    
    @staticmethod
    def extract_top_keywords(text: str, tfidf_scores: dict, top_k: int = 5) -> list:
        """
        Extract top TF-IDF keywords from text that influenced prediction.
        
        Args:
            text: Original ticket text
            tfidf_scores: Dictionary of term scores
            top_k: Number of top keywords to return
            
        Returns:
            List of top keywords with scores
        """
        sorted_terms = sorted(tfidf_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {"term": term, "score": float(score)}
            for term, score in sorted_terms[:top_k]
        ]
