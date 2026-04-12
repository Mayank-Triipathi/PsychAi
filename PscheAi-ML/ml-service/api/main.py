from fastapi import FastAPI
from api.schemas import StressRequest, StressResponse
from ml.stress_analyzer.model_service import analyze_stress

app = FastAPI(title="AI Stress Detection API")

@app.post("/analyze-stress", response_model=StressResponse)
def analyze(data: StressRequest):
    result = analyze_stress(data.answers)
    return result