# EcoTrade — Garbage Classification & Waste Sorting System ♻️

**EcoTrade** is a machine learning / AI system for classifying types of garbage (waste), to help automate and assist in waste sorting.  
It supports training, validation, inference, and modular model architectures.

---

## 🚀 Features

- Multi-class classification of waste (e.g. plastic, paper, metal, organic, glass, etc.)  
- Support for different model architectures (e.g. CNNs, transfer learning models)  
- Data preprocessing, augmentation, and pipeline  
- Training, evaluation, and real-time inference/prediction  
- Easy extension to new classes or models  

---

## 📂 Repository Structure

```
ecotrade/
├── MODEL_1_MobileNet/         # implementation using MobileNet (or variant)  
├── MODEL_2_SVM/               # classical ML (e.g. SVM) module  
├── MODEL_3_ResNet/            # implementation using ResNet (or variant)  
├── dataset/                   # raw, processed, splits, helpers  
│   ├── raw/
│   ├── processed/
│   ├── train/
│   ├── val/
│   └── test/
├── utils/                     # utility scripts (data loading, transforms, metrics)  
├── train.py                   # main training script  
├── evaluate.py                # evaluation / validation script  
├── predict.py                 # inference / prediction script  
├── requirements.txt           # required Python packages  
└── README.md                  # this file  
```

---

## 🛠️ Installation & Setup

1. **Clone repository**  
   ```bash
   git clone https://github.com/ImanuelYusuf2006/ecotrade.git
   cd ecotrade
   ```

2. **(Optional) Create and activate virtual environment**  
   ```bash
   python3 -m venv venv
   source venv/bin/activate       # macOS / Linux
   venv\Scripts\activate          # Windows
   ```

3. **Install dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

4. **Prepare dataset**  
   Place your images/data under `dataset/raw/`.  
   If preprocessing is required, run your preprocessing script (e.g. `python utils/preprocess.py`).

---

## 📊 Usage

### Train a model
```bash
python train.py   --model resnet   --epochs 30   --batch_size 32   --learning_rate 1e-4   --data_dir dataset/processed
```

### Evaluate / validate
```bash
python evaluate.py   --model resnet   --checkpoint path/to/model_checkpoint.pth   --data_dir dataset/processed/val
```

### Predict / inference
```bash
python predict.py   --model resnet   --checkpoint path/to/model_checkpoint.pth   --input path/to/image.jpg
```

---

## 🧠 Models & Approaches

- **MobileNet** (lightweight, efficient)  
- **ResNet** (deep CNN, high accuracy)  
- **SVM** (classical machine learning baseline)  

Extendable to other architectures.

---

## 📂 Dataset & Data Handling

- **raw/** — original unprocessed images  
- **processed/** — resized / normalized / cleaned data  
- **train/**, **val/**, **test/** — dataset splits  

Preprocessing includes resizing, normalization, augmentation, and class balancing.

---

## 📈 Evaluation & Metrics

- Accuracy  
- Precision, Recall, F1-score  
- Confusion matrix  
- ROC / AUC  
- Per-class performance  

Visualizations can be done with TensorBoard, Matplotlib, or Weights & Biases.

---

## 🧩 Extending the System

- Add new waste categories by updating dataset & model output layers  
- Add new architectures by creating modules (e.g. EfficientNet, VGG)  
- Improve preprocessing / augmentation  
- Deploy as API (Flask/FastAPI) or mobile app  
- Optimize models with pruning/quantization  

---

## 🛡️ Contributing

1. Fork the repository  
2. Create a feature branch: `git checkout -b feature/YourFeature`  
3. Commit changes  
4. Push your branch and create a Pull Request  

---

## 📄 License

```
MIT License

Copyright (c) 2025 Imanuel Yusuf
```

---

## 👤 Contact & Acknowledgements

- **Maintainer**: Imanuel Yusuf  
- **GitHub**: [ImanuelYusuf2006](https://github.com/ImanuelYusuf2006)  
- **Acknowledgements**: thanks to open datasets, libraries (`torch`, `tensorflow`, `scikit-learn`, etc.), and contributors  

---
