from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import gdown
from tensorflow.keras.models import load_model
from PIL import Image
import io

# -------------------------------
# Initialize FastAPI
# -------------------------------
app = FastAPI()

# -------------------------------
# CORS (VERY IMPORTANT)
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict to Netlify URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Model Download
# -------------------------------
MODEL_PATH = "best_resnet50_breakhis.keras"

if not os.path.exists(MODEL_PATH):
    print("Downloading model...")
    url = "https://drive.google.com/uc?id=14PsTcC8_gP_h2jBBFlZF4CAucJUZAqXW"
    gdown.download(url, MODEL_PATH, quiet=False)

# -------------------------------
# Load Model
# -------------------------------
model = load_model(MODEL_PATH)

IMG_SIZE = (224, 224)

# -------------------------------
# Preprocess Function
# -------------------------------
def preprocess(img):
    img = img.resize(IMG_SIZE)
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

# -------------------------------
# Health Check Route
# -------------------------------
@app.get("/")
def home():
    return {"message": "API is running 🚀"}

# -------------------------------
# Prediction API
# -------------------------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        img = preprocess(img)
        pred = model.predict(img)

        confidence = float(np.max(pred))
        class_index = int(np.argmax(pred))

        labels = ["Benign", "Malignant"]
        label = labels[class_index]

        return {
            "prediction": label,
            "confidence": round(confidence * 100, 2)
        }

    except Exception as e:
        return {"error": str(e)}