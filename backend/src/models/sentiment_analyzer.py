"""Sentiment Analysis module using transformers."""

from transformers import pipeline
import logging

log = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Sentiment analysis using DistilBERT transformer model.
    Detects customer emotion/sentiment from ticket text.
    """
    
    def __init__(self):
        """Initialize the sentiment analysis pipeline."""
        try:
            self.pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU (-1) or GPU (0)
            )
            log.info("✅ Sentiment analyzer loaded successfully")
        except Exception as e:
            log.error(f"❌ Failed to load sentiment analyzer: {e}")
            self.pipeline = None
    
    def analyze(self, text: str) -> dict:
        """
        Analyze sentiment of given text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict with sentiment label and score
            Example: {"sentiment": "POSITIVE", "score": 0.95}
        """
        if not text or not self.pipeline:
            return {"sentiment": "NEUTRAL", "score": 0.0, "error": "Text empty or analyzer unavailable"}
        
        try:
            result = self.pipeline(text[:512])[0]  # Truncate to 512 tokens max
            return {
                "sentiment": result["label"].upper(),
                "score": round(float(result["score"]), 4),
                "is_negative": result["label"].upper() == "NEGATIVE"
            }
        except Exception as e:
            log.error(f"Sentiment analysis failed: {e}")
            return {"sentiment": "ERROR", "score": 0.0, "error": str(e)}


class EmotionDetector:
    """
    Detect emotion intensity (anger, frustration) from ticket text.
    """
    
    @staticmethod
    def detect_urgency_signals(text: str) -> dict:
        """
        Detect urgency signals in text using keyword matching.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict with urgency level and detected signals
        """
        text_lower = text.lower()
        
        urgent_keywords = {
            "critical": ["critical", "urgent", "asap", "emergency", "immediate"],
            "angry": ["angry", "furious", "disgusted", "hate", "terrible", "worst"],
            "frustrated": ["frustrated", "confused", "stuck", "broken", "not working"],
            "repeated": ["again", "another", "still", "same issue", "third time"]
        }
        
        detected = {}
        total_weight = 0
        
        for category, keywords in urgent_keywords.items():
            weight = sum(text_lower.count(kw) for kw in keywords)
            if weight > 0:
                detected[category] = weight
                total_weight += weight
        
        urgency_level = "LOW"
        if total_weight >= 3:
            urgency_level = "HIGH"
        elif total_weight >= 1:
            urgency_level = "MEDIUM"
        
        return {
            "urgency_level": urgency_level,
            "urgency_score": min(total_weight / 5, 1.0),
            "detected_signals": detected
        }
