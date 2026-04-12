from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = "model/bert_stress_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
bert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

bert_model.eval()