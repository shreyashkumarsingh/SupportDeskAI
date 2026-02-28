"""Tests for model and monitoring components."""

import pytest
import numpy as np
from unittest.mock import Mock
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

from models.monitor import ModelMonitor, ConfidenceCalibrator


class TestModelMonitor:
    """Test model monitoring functionality."""
    
    def test_monitor_initialization(self):
        """Test monitor initialization."""
        monitor = ModelMonitor(window_size=50)
        assert monitor.window_size == 50
        assert monitor.stats["total_predictions"] == 0
    
    def test_monitor_update(self):
        """Test monitor update."""
        monitor = ModelMonitor()
        monitor.update("Bug", 0.95)
        
        assert monitor.stats["total_predictions"] == 1
        assert monitor.stats["avg_confidence"] == 0.95
    
    def test_monitor_multiple_updates(self):
        """Test monitor with multiple updates."""
        monitor = ModelMonitor()
        
        predictions = [
            ("Bug", 0.9),
            ("Feature", 0.85),
            ("Incident", 0.88),
            ("Change", 0.92)
        ]
        
        for pred, conf in predictions:
            monitor.update(pred, conf)
        
        assert monitor.stats["total_predictions"] == 4
        expected_avg = np.mean([c for _, c in predictions])
        assert abs(monitor.stats["avg_confidence"] - expected_avg) < 0.01
    
    def test_monitor_low_confidence_tracking(self):
        """Test low confidence prediction tracking."""
        monitor = ModelMonitor()
        
        monitor.update("Bug", 0.9)
        monitor.update("Feature", 0.4)  # Low confidence
        monitor.update("Incident", 0.45)  # Low confidence
        
        assert monitor.stats["low_confidence_count"] == 2
    
    def test_monitor_drift_detection(self):
        """Test drift detection."""
        monitor = ModelMonitor(drift_threshold=0.2)
        
        # Add many low-confidence predictions
        for i in range(25):
            monitor.update("Bug", 0.4)  # Low confidence
        
        assert monitor.stats["drift_detected"] is True
    
    def test_monitor_accuracy_calculation(self):
        """Test accuracy calculation."""
        monitor = ModelMonitor()
        
        # Add predictions with true labels
        monitor.update("Bug", 0.9, true_label="Bug")  # Correct
        monitor.update("Feature", 0.85, true_label="Feature")  # Correct
        monitor.update("Incident", 0.88, true_label="Bug")  # Incorrect
        
        accuracy = monitor.get_accuracy()
        assert accuracy == 2 / 3  # 2 out of 3 correct
    
    def test_monitor_needs_retraining(self):
        """Test retraining recommendation."""
        monitor = ModelMonitor()
        
        # All high confidence - no retraining needed
        for _ in range(10):
            monitor.update("Bug", 0.95)
        
        assert monitor.needs_retraining() is False
        
        # Now add low confidence predictions to trigger retraining
        monitor2 = ModelMonitor()
        for _ in range(10):
            monitor2.update("Bug", 0.4)
        
        assert monitor2.needs_retraining() is True
    
    def test_monitor_get_stats(self):
        """Test getting statistics."""
        monitor = ModelMonitor()
        
        for pred in ["Bug", "Feature", "Bug", "Incident"]:
            monitor.update(pred, 0.85)
        
        stats = monitor.get_stats()
        assert "total_predictions" in stats
        assert "accuracy" in stats
        assert "recent_prediction_distribution" in stats
        assert "confidence_range" in stats


class TestConfidenceCalibrator:
    """Test confidence calibration."""
    
    def test_calibrator_initialization(self):
        """Test calibrator initialization."""
        calibrator = ConfidenceCalibrator(temperature=1.5)
        assert calibrator.temperature == 1.5
    
    def test_calibrator_scaling(self):
        """Test temperature scaling."""
        calibrator = ConfidenceCalibrator(temperature=2.0)
        
        raw_scores = np.array([1.0, 2.0, 3.0])
        calibrated = calibrator.calibrate_confidence(raw_scores)
        
        # Calibrated scores should sum to 1 (softmax property)
        assert abs(np.sum(calibrated) - 1.0) < 0.001
        
        # All probabilities should be between 0 and 1
        assert np.all(calibrated >= 0)
        assert np.all(calibrated <= 1)
    
    def test_calibrator_higher_temperature_smooths(self):
        """Test that higher temperature smooths probabilities."""
        scores = np.array([1.0, 2.0, 3.0])
        
        calibrator_low = ConfidenceCalibrator(temperature=0.5)
        calibrator_high = ConfidenceCalibrator(temperature=2.0)
        
        probs_low = calibrator_low.calibrate_confidence(scores)
        probs_high = calibrator_high.calibrate_confidence(scores)
        
        # Higher temperature should result in more uniform distribution
        std_low = np.std(probs_low)
        std_high = np.std(probs_high)
        assert std_high < std_low


class TestDriftDetection:
    """Test data drift detection in monitor."""
    
    def test_drift_high_variance(self):
        """Test drift detection with high confidence variance."""
        monitor = ModelMonitor(drift_threshold=0.2)
        
        # Alternate between high and low confidence
        for i in range(30):
            conf = 0.95 if i % 2 == 0 else 0.3
            monitor.update("Bug", conf)
        
        assert monitor.stats["drift_detected"] is True
    
    def test_no_drift_stable_confidence(self):
        """Test no drift when confidence is stable."""
        monitor = ModelMonitor(drift_threshold=0.1)
        
        # Consistently high confidence
        for _ in range(30):
            monitor.update("Bug", 0.92)
        
        assert monitor.stats["drift_detected"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
