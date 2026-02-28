import re
import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)


def clean_text(text: str, lemmatize: bool = True) -> str:
    """
    Comprehensive text cleaning pipeline.
    
    Args:
        text: Raw text to clean
        lemmatize: Whether to apply lemmatization
        
    Returns:
        Cleaned text string
    """
    if pd.isna(text):
        return ""

    text = str(text).lower()

    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)

    # Remove phone numbers
    text = re.sub(r'\b\d{10,}\b', '', text)

    # Remove special characters but keep spaces and hyphens
    text = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', text)

    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text).strip()

    # Tokenize
    tokens = word_tokenize(text)

    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [t for t in tokens if t not in stop_words and len(t) > 2]

    # Lemmatization
    if lemmatize:
        lemmatizer = WordNetLemmatizer()
        tokens = [lemmatizer.lemmatize(t) for t in tokens]

    return ' '.join(tokens)


def validate_text_input(text: str, min_length: int = 5, max_length: int = 5000) -> tuple[bool, str]:
    """
    Validate text input for length and content.
    
    Args:
        text: Text to validate
        min_length: Minimum required length
        max_length: Maximum allowed length
        
    Returns:
        Tuple of (is_valid: bool, message: str)
    """
    if not text or pd.isna(text):
        return False, "Text cannot be empty"
    
    text_len = len(str(text).strip())
    if text_len < min_length:
        return False, f"Text too short (minimum {min_length} characters)"
    
    if text_len > max_length:
        return False, f"Text too long (maximum {max_length} characters)"
    
    return True, "Valid"

