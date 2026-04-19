import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib
import os

print("🚀 Training Financial Risk Models...\n")

# Create sample training data
training_data = [
    # Monetary Policy
    ("RBI keeps repo rate unchanged at 6.5%", "monetary_policy"),
    ("Federal Reserve announces 25 basis point hike", "monetary_policy"),
    ("Central bank cuts interest rates", "monetary_policy"),
    
    # Fraud
    ("CFO resigns amid accounting scandal", "fraud"),
    ("Regulators probe company for financial irregularities", "fraud"),
    ("Whistleblower alleges $500M accounting fraud", "fraud"),
    
    # Merger
    ("HDFC Bank completes merger with HDFC Ltd", "merger"),
    ("Tech giant acquires AI startup for $1B", "merger"),
    ("Board approves acquisition of rival company", "merger"),
    
    # Legal
    ("Company faces class action lawsuit", "legal"),
    ("SEC files charges against executives", "legal"),
    ("Court rules against bank in fraud case", "legal"),
    
    # Earnings
    ("Q3 profits beat expectations", "earnings"),
    ("Company reports 20% revenue growth", "earnings"),
    ("Earnings miss sends stock down 10%", "earnings"),
    
    # Regulatory
    ("New banking regulations announced", "regulatory"),
    ("RBI introduces stricter compliance norms", "regulatory"),
    ("SEBI tightens disclosure requirements", "regulatory"),
    
    # Bankruptcy
    ("Retail chain files Chapter 11", "bankruptcy"),
    ("Unable to pay debt, company declares bankruptcy", "bankruptcy"),
    ("Creditors push for insolvency proceedings", "bankruptcy"),
]

# Convert to DataFrame
df = pd.DataFrame(training_data, columns=["text", "event_type"])

print(f"📊 Training samples: {len(df)}")

# Create and train model
print("🔄 Training event classifier...")
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=1000)),
    ('clf', LogisticRegression(max_iter=1000))
])

pipeline.fit(df["text"], df["event_type"])

# Create ml folder if doesn't exist
os.makedirs("ml", exist_ok=True)

# Save model
model_path = "ml/event_classifier.pkl"
joblib.dump(pipeline, model_path)
print(f"✅ Model saved to: {model_path}")

# Test the model
test_texts = [
    "RBI announces interest rate decision",
    "CEO resigns amid fraud investigation",
    "Company beats earnings estimates"
]

print("\n🧪 Testing model:")
for text in test_texts:
    pred = pipeline.predict([text])[0]
    proba = max(pipeline.predict_proba([text])[0])
    print(f"  '{text[:30]}...' → {pred} ({proba:.2%})")

print("\n🎯 Training complete!")