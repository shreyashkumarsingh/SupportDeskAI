import joblib

class TicketClassifier:
    def __init__(self, vectorizer, model):
        self.vectorizer = vectorizer
        self.model = model

    def predict(self, text: str):
        X = self.vectorizer.transform([text])
        pred = self.model.predict(X)[0]
        proba = None
        if hasattr(self.model, "decision_function"):
            proba = self.model.decision_function(X)
        return pred, proba
