from services.prediction_service import prediction_service

print("🔬 Testing Prediction Service\n")

# Test headlines
test_headlines = [
    "RBI raises interest rates by 25 basis points",
    "Bank CFO resigns amid fraud investigation",
    "Tech company announces $2B acquisition",
    "Q4 earnings beat analyst estimates",
]

for headline in test_headlines:
    # Get predictions
    event_type, confidence = prediction_service.predict_event(headline)
    risk = prediction_service.predict_risk(event_type)
    duration = prediction_service.predict_duration(event_type)
    
    print(f"📰 Headline: {headline}")
    print(f"   📊 Event: {event_type}")
    print(f"   🔢 Confidence: {confidence:.2%}")
    print(f"   ⚠️ Risk: {risk}")
    print(f"   ⏱️ Duration: {duration}")
    print()