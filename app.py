from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os
import gdown

MODEL_PATH = "best_resnet50_breakhis.keras"

if not os.path.exists(MODEL_PATH):
    url = "https://drive.google.com/uc?id=14PsTcC8_gP_h2jBBFlZF4CAucJUZAqXW "
    gdown.download(url, MODEL_PATH, quiet=False)
app = Flask(__name__)
CORS(app)

model = load_model("best_resnet50_breakhis.keras")

IMG_SIZE = (224, 224)

def preprocess(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img = image.img_to_array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["file"]
    file.save("temp.jpg")

    img = preprocess("temp.jpg")
    pred = model.predict(img)

    confidence = float(np.max(pred))
    class_index = int(np.argmax(pred))

    labels = ["Benign", "Malignant"]
    label = labels[class_index]

    return jsonify({
        "prediction": label,
        "confidence": round(confidence * 100, 2)
    })

app.run(debug=True)