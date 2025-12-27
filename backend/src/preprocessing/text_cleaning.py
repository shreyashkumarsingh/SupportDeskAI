import re
import pandas as pd


def clean_text(text: str) -> str:
    if pd.isna(text):
        return ""

    text = text.lower()

    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)

    # Remove phone numbers
    text = re.sub(r'\b\d{10,}\b', '', text)

    # Remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)

    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text).strip()

    return text
