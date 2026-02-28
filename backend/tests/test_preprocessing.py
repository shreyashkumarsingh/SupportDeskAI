"""Unit and integration tests for text cleaning and preprocessing."""

import pytest
from preprocessing.text_cleaning import clean_text, validate_text_input


class TestTextCleaning:
    """Test text cleaning functionality."""
    
    def test_clean_text_basic(self):
        """Test basic text cleaning."""
        text = "Hello World! This is a TEST."
        result = clean_text(text, lemmatize=False)
        assert "hello" in result.lower()
        assert "world" in result.lower()
    
    def test_clean_text_removes_urls(self):
        """Test URL removal."""
        text = "Check this https://example.com and www.test.com"
        result = clean_text(text, lemmatize=False)
        assert "https" not in result
        assert "www" not in result
    
    def test_clean_text_removes_emails(self):
        """Test email removal."""
        text = "Contact us at support@example.com for help"
        result = clean_text(text, lemmatize=False)
        assert "@" not in result
    
    def test_clean_text_removes_special_chars(self):
        """Test special character removal."""
        text = "Test@#$%! String***"
        result = clean_text(text, lemmatize=False)
        assert "@" not in result
        assert "#" not in result
        assert "$" not in result
    
    def test_clean_text_handles_none(self):
        """Test handling of None/NaN input."""
        result = clean_text(None, lemmatize=False)
        assert result == ""
    
    def test_clean_text_lemmatization(self):
        """Test lemmatization."""
        text = "running runs runner"
        result = clean_text(text, lemmatize=True)
        # After lemmatization, should have fewer tokens
        assert len(result.split()) <= 3
    
    def test_clean_text_stopword_removal(self):
        """Test stopword removal."""
        text = "the quick brown fox jumps over the lazy dog"
        result = clean_text(text, lemmatize=False)
        # Common stopwords should be removed
        assert "the" not in result
        assert "over" not in result


class TestTextValidation:
    """Test text validation functionality."""
    
    def test_validate_text_valid(self):
        """Test valid text passes validation."""
        text = "This is a valid support ticket subject"
        is_valid, msg = validate_text_input(text)
        assert is_valid is True
    
    def test_validate_text_too_short(self):
        """Test text too short fails validation."""
        text = "Hi"
        is_valid, msg = validate_text_input(text, min_length=5)
        assert is_valid is False
        assert "too short" in msg.lower()
    
    def test_validate_text_too_long(self):
        """Test text too long fails validation."""
        text = "A" * 6000
        is_valid, msg = validate_text_input(text, max_length=5000)
        assert is_valid is False
        assert "too long" in msg.lower()
    
    def test_validate_text_empty(self):
        """Test empty text fails validation."""
        is_valid, msg = validate_text_input("")
        assert is_valid is False
    
    def test_validate_text_custom_limits(self):
        """Test validation with custom length limits."""
        text = "Test"
        is_valid, msg = validate_text_input(text, min_length=2, max_length=10)
        assert is_valid is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
