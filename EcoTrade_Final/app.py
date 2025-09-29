from flask import Flask, render_template, request, jsonify, session
import tensorflow as tf

import numpy as np
import pickle
import os
import uuid
import cv2 #
from tensorflow.keras.applications import imagenet_utils

app = Flask(__name__)
app.secret_key = "ecotrade_secret_key_yang_lebih_aman"

MODEL_PATH = 'models/garbage_classifier_final.h5'
CLASS_NAMES_PATH = 'models/class_names.pkl'
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    #model = tf.keras.models.load_model(MODEL_PATH)

    model = tf.keras.models.load_model(
        MODEL_PATH,
        custom_objects={"imagenet_utils": imagenet_utils}
    )

    with open(CLASS_NAMES_PATH, 'rb') as f:
        CLASS_NAMES = pickle.load(f)
except Exception as e:
    print(f"Error loading model or class names: {e}")
    model = None
    CLASS_NAMES = []

PRICES = {
    "battery": 0, "biological": 300, "brown-glass": 700, "cardboard": 1500,
    "clothes": 1000, "green-glass": 700, "metal": 3000, "paper": 1200,
    "plastic": 2000, "shoes": 800, "trash": 0, "white-glass": 700
}

def preprocess_image(img_bytes):
    nparr = np.frombuffer(img_bytes, np.uint8)
    img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    img_resized = cv2.resize(img_np, (224, 224))
    return np.expand_dims(img_resized, axis=0)

# Routes
@app.route("/")
def home():
    if "cart" not in session:
        session["cart"] = []
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and model:
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        file.seek(0)
        file.save(filepath)
        
        img_bytes = open(filepath, 'rb').read()

        processed_image = preprocess_image(img_bytes)

        preds = model.predict(processed_image)
        
        class_idx = np.argmax(preds)
        class_name = CLASS_NAMES[class_idx]
        price = PRICES.get(class_name, 0)
        
        # Tambahkan baris berikut untuk menghitung dan menampilkan tingkat keyakinan
        confidence = float(np.max(preds))

        return jsonify({
            "class": class_name.replace("_", " ").title(),
            "price": price,
            "filepath": filepath,
            "confidence": confidence
        })
    return jsonify({"error": "Model not loaded or file error"}), 500

@app.route("/add_to_cart", methods=["POST"])
def add_to_cart():
    data = request.json
    if not all(k in data for k in ["class", "price", "date"]):
        return jsonify({"error": "Missing data"}), 400
    if "cart" not in session:
        session["cart"] = []
    item = {
        "id": str(uuid.uuid4()), "class": data["class"],
        "price": data["price"], "date": data.get("date", "Belum diatur")
    }
    session["cart"].append(item)
    session.modified = True
    return jsonify({"cart": session["cart"]})

@app.route("/cart", methods=["GET"])
def get_cart():
    return jsonify(session.get("cart", []))

@app.route("/checkout", methods=["POST"])
def checkout():
    cart = session.get("cart", [])
    if not cart:
        return jsonify({"error": "Keranjang kosong"}), 400
    total_pendapatan = sum(item["price"] for item in cart)
    biaya_penjemputan = 5000
    pendapatan_bersih = total_pendapatan - biaya_penjemputan
    session.pop("cart", None)
    return jsonify({
        "cart": cart, "total_pendapatan": total_pendapatan,
        "biaya_penjemputan": biaya_penjemputan,
        "pendapatan_bersih": pendapatan_bersih if pendapatan_bersih > 0 else 0
    })


if __name__ == "__main__":
    app.run(debug=True)