import pytest
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))


@pytest.fixture
def sample_ticket():
    """Fixture providing a sample support ticket."""
    return {
        "subject": "Cannot login to account",
        "description": "I'm unable to log into my account. I've tried resetting my password but it's still not working. This is urgent!"
    }


@pytest.fixture
def sample_tickets():
    """Fixture providing multiple sample support tickets."""
    return [
        {
            "subject": "Payment processing error",
            "description": "My payment failed but I was still charged. Please refund immediately."
        },
        {
            "subject": "Request for feature",
            "description": "It would be great if you could add darkmode support"
        },
        {
            "subject": "Bug in the system",
            "description": "The application crashes when I try to export data"
        }
    ]


@pytest.fixture
def mock_model():
    """Fixture providing a mock ML model."""
    from unittest.mock import Mock
    
    model = Mock()
    model.classes_ = ["Bug", "Feature", "Incident", "Problem"]
    model.predict = Mock(return_value=["Bug"])
    model.decision_function = Mock(return_value=[[1.5, 0.3, 0.1, -0.2]])
    model.predict_proba = Mock(return_value=[[0.85, 0.10, 0.04, 0.01]])
    
    return model


@pytest.fixture
def mock_vectorizer():
    """Fixture providing a mock TF-IDF vectorizer."""
    from unittest.mock import Mock
    import numpy as np
    
    vectorizer = Mock()
    vectorizer.transform = Mock(return_value=[[0.1, 0.2, 0.3, 0.0]])
    vectorizer.n_features_in_ = 1000
    vectorizer.get_feature_names_out = Mock(return_value=[
        "cannot", "login", "account", "password", "reset"
    ])
    
    return vectorizer


@pytest.fixture
def cleaned_text():
    """Fixture providing cleaned text."""
    return "cannot login account password reset tried"


@pytest.fixture
def test_data():
    """Fixture providing test data for parameterized tests."""
    return {
        "texts": [
            "Cannot login to account",
            "Payment failed charges",
            "Feature request darkmode",
            "Bug system crashes"
        ],
        "categories": ["Incident", "Problem", "Request", "Bug"],
        "confidences": [0.92, 0.87, 0.91, 0.88]
    }
