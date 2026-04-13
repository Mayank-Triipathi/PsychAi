import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
bert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
# 🟢 Step-by-step (every time)
# 1. Go to your project folder
# cd PscheAi-ML/ml-service
# 2. Activate your virtual environment
# source api/venv/bin/activate

# 👉 You should see:

# (venv) ...
# 3. Start the FastAPI server
# uvicorn api.main:app --reload
# 4. Open in browser
# http://127.0.0.1:8000/docs

# 👉 This is your API UI (Swagger)