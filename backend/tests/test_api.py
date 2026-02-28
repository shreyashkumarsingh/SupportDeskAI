"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

# Import app
from api.app import app

client = TestClient(app)


class TestHealthCheck:
    """Test health check endpoint."""
    
    def test_health_check_returns_200(self):
        """Test health check returns 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_check_structure(self):
        """Test health check response structure."""
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data
        assert "components" in data
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True


class TestPredictionEndpoint:
    """Test prediction endpoint."""
    
    def test_predict_valid_input(self):
        """Test prediction with valid input."""
        payload = {
            "subject": "Cannot login to my account",
            "description": "I am unable to log into my account. The password seems correct but it keeps saying invalid credentials. Please help.",
            "user_id": "test_user_123"
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "category" in data
        assert "confidence" in data
        assert "top_classes" in data
        assert "request_id" in data
        assert isinstance(data["confidence"], float)
        assert 0 <= data["confidence"] <= 1
    
    def test_predict_missing_field(self):
        """Test prediction with missing required field."""
        payload = {
            "subject": "Test subject"
            # Missing description
        }
        response = client.post("/predict", json=payload)
        assert response.status_code != 200  # Should fail validation
    
    def test_predict_subject_too_short(self):
        """Test prediction with subject too short."""
        payload = {
            "subject": "Hi",
            "description": "This is a valid description with enough content"
        }
        response = client.post("/predict", json=payload)
        # Should fail validation or return error
        assert response.status_code != 200
    
    def test_predict_empty_description(self):
        """Test prediction with empty description."""
        payload = {
            "subject": "Valid subject here",
            "description": ""
        }
        response = client.post("/predict", json=payload)
        assert response.status_code != 200
    
    def test_predict_response_structure(self):
        """Test prediction response has all expected fields."""
        payload = {
            "subject": "Payment processing error",
            "description": "My payment failed to process but I was still charged. This is urgent!"
        }
        response = client.post("/predict", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            assert "category" in data
            assert "confidence" in data
            assert "top_classes" in data
            assert "timestamp" in data
            
            # top_classes should be a list
            assert isinstance(data["top_classes"], list)
            assert len(data["top_classes"]) > 0
            
            # Each top class should have label and score
            for tc in data["top_classes"]:
                assert "label" in tc
                assert "score" in tc


class TestBatchPrediction:
    """Test batch prediction endpoint."""
    
    def test_batch_predict_valid(self):
        """Test batch prediction with valid input."""
        payload = {
            "tickets": [
                {
                    "subject": "Cannot access account",
                    "description": "I cannot access my account anymore"
                },
                {
                    "subject": "Refund request",
                    "description": "I want to request a refund for my purchase"
                }
            ]
        }
        response = client.post("/predict/batch", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "request_id" in data
        assert "total" in data
        assert "successful" in data
        assert "results" in data
        assert data["total"] == 2
    
    def test_batch_predict_max_items(self):
        """Test batch prediction respects max items limit."""
        # Create 101 tickets (exceeds 100 limit)
        tickets = [
            {
                "subject": f"Issue {i}",
                "description": f"This is issue number {i} with enough description to pass validation"
            }
            for i in range(101)
        ]
        
        payload = {"tickets": tickets}
        response = client.post("/predict/batch", json=payload)
        # Should fail validation for exceeding max items
        assert response.status_code != 200
    
    def test_batch_predict_empty(self):
        """Test batch prediction with empty list."""
        payload = {"tickets": []}
        response = client.post("/predict/batch", json=payload)
        assert response.status_code != 200


class TestFeedback:
    """Test feedback endpoint."""
    
    def test_submit_feedback_valid(self):
        """Test submitting valid feedback."""
        payload = {
            "prediction_id": "abc123",
            "correct_category": "Bug",
            "comments": "The prediction was wrong"
        }
        response = client.post("/feedback", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "received"
    
    def test_submit_feedback_minimal(self):
        """Test submitting feedback with minimal data."""
        payload = {
            "prediction_id": "xyz789",
            "correct_category": "Feature Request"
        }
        response = client.post("/feedback", json=payload)
        assert response.status_code == 200


class TestModelInfo:
    """Test model info endpoint."""
    
    def test_model_info_returns_data(self):
        """Test model info endpoint returns data."""
        response = client.get("/model/info")
        assert response.status_code == 200
        
        data = response.json()
        assert "model_type" in data
        assert "classes" in data
        assert "capabilities" in data
        assert "version" in data


class TestStats:
    """Test statistics endpoint."""
    
    def test_stats_endpoint(self):
        """Test stats endpoint if monitoring is available."""
        response = client.get("/stats")
        # May return 503 if monitoring not available, or 200 with stats
        assert response.status_code in [200, 503]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
