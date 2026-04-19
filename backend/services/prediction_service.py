import joblib
import os

class PredictionService:
    def __init__(self):
        self.event_classifier = None
        self.load_models()
    
    def load_models(self):
        """Load ML models at startup"""
        model_path = "ml/event_classifier.pkl"
        
        if os.path.exists(model_path):
            self.event_classifier = joblib.load(model_path)
            print("✅ Event classifier loaded successfully")
        else:
            print(f"⚠️ Model not found at {model_path}")
    
    def predict_event(self, text):
        """Predict event type and confidence"""
        if not self.event_classifier:
            return "unknown", 0.0
        
        # Get prediction
        pred = self.event_classifier.predict([text])[0]
        
        # Get confidence score
        proba = self.event_classifier.predict_proba([text])[0]
        confidence = max(proba)
        
        return pred, confidence
    
    def predict_risk(self, event_type):
        """Rule-based risk scoring"""
        risk_map = {
            "fraud": "critical",
            "bankruptcy": "critical",
            "legal": "high",
            "regulatory": "high",
            "earnings": "medium",
            "monetary_policy": "medium",
            "merger": "medium",
            "credit_rating": "medium",
            "macro_event": "low",
            "geopolitical": "low"
        }
        
        return risk_map.get(event_type, "medium")
    
    def predict_duration(self, event_type):
        """Rule-based impact duration"""
        duration_map = {
            "fraud": "long_term",
            "bankruptcy": "long_term",
            "legal": "medium_term",
            "regulatory": "medium_term",
            "earnings": "short_term",
            "monetary_policy": "medium_term",
            "merger": "long_term",
        }
        
        return duration_map.get(event_type, "short_term")

# Create global instance
prediction_service = PredictionService()