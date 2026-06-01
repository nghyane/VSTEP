"""
NLP Sidecar — GECToR + CEFR Classifier.

Endpoints:
  POST /grammar/check   — token-level grammar error detection
  POST /cefr/predict    — CEFR level classification
  GET  /health          — readiness
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Paths — Docker build downloads to /app/models, local dev to /tmp/hf_models
MODELS_DIR = os.environ.get("MODELS_DIR", "/app/models")
CEFR_MODEL_DIR = os.path.join(MODELS_DIR, "cefr-classifier")
GECTOR_MODEL_DIR = os.path.join(MODELS_DIR, "gector-large-2024")

# Global model holders
cefr_model = None
cefr_tokenizer = None
gector_session = None
gector_tokenizer = None
gector_labels = None


def load_cefr():
    global cefr_model, cefr_tokenizer
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    if not os.path.exists(os.path.join(CEFR_MODEL_DIR, "config.json")):
        print(f"CEFR model not found at {CEFR_MODEL_DIR}, skipping.")
        return False

    cefr_tokenizer = AutoTokenizer.from_pretrained(CEFR_MODEL_DIR)
    cefr_model = AutoModelForSequenceClassification.from_pretrained(CEFR_MODEL_DIR)
    cefr_model.eval()
    print(f"CEFR model loaded: {sum(p.numel() for p in cefr_model.parameters())/1e6:.0f}M params")
    return True


def load_gector():
    global gector_session, gector_tokenizer, gector_labels
    import onnxruntime as ort
    from transformers import AutoTokenizer

    onnx_path = os.path.join(GECTOR_MODEL_DIR, "onnx", "model_quantized.onnx")
    labels_path = os.path.join(GECTOR_MODEL_DIR, "labels.txt")

    if not os.path.exists(onnx_path):
        print(f"GECToR ONNX not found at {onnx_path}, skipping.")
        return False

    gector_tokenizer = AutoTokenizer.from_pretrained(GECTOR_MODEL_DIR)
    gector_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    with open(labels_path) as f:
        gector_labels = [line.strip() for line in f.readlines()]

    print(f"GECToR loaded: {len(gector_labels)} labels, ONNX CPU")
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup."""
    t0 = time.time()
    cefr_ok = load_cefr()
    gector_ok = load_gector()
    print(f"Models loaded in {time.time()-t0:.1f}s (CEFR={cefr_ok}, GECToR={gector_ok})")
    yield


app = FastAPI(title="VSTEP NLP Sidecar", lifespan=lifespan)


# ─── Schemas ───────────────────────────────────────────────────────────────────


class TextInput(BaseModel):
    text: str
    language: str = "en"


class GrammarError(BaseModel):
    token: str
    position: int
    tag: str
    correction: Optional[str] = None
    error_type: Optional[str] = None


class GrammarResponse(BaseModel):
    errors: list[GrammarError]
    inference_ms: float


class CefrResponse(BaseModel):
    predicted_level: str
    confidence: float
    all_levels: dict[str, float]
    inference_ms: float


# ─── Endpoints ─────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {
        "status": "ok",
        "cefr_loaded": cefr_model is not None,
        "gector_loaded": gector_session is not None,
    }


@app.post("/grammar/check", response_model=GrammarResponse)
def grammar_check(input: TextInput):
    if gector_session is None:
        raise HTTPException(503, "GECToR model not loaded")

    t0 = time.time()

    # Tokenize
    inputs = gector_tokenizer(
        input.text,
        return_tensors="np",
        padding=True,
        truncation=True,
        max_length=128,
    )

    # Filter to only inputs the model expects
    input_names = [i.name for i in gector_session.get_inputs()]
    feed = {k: v for k, v in inputs.items() if k in input_names}

    # Inference
    outputs = gector_session.run(None, feed)
    logits = outputs[0]  # (1, seq_len, num_labels)
    predictions = np.argmax(logits, axis=-1)[0]

    # Parse errors
    tokens = gector_tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    errors = []
    for i, (token, pred_id) in enumerate(zip(tokens, predictions)):
        if token in ["<s>", "</s>", "<pad>", "<mask>"]:
            continue
        if pred_id >= len(gector_labels):
            continue
        label = gector_labels[pred_id]
        if label == "$KEEP":
            continue

        error_type, correction = parse_gector_label(label)
        errors.append(GrammarError(
            token=token,
            position=i,
            tag=label,
            correction=correction,
            error_type=error_type,
        ))

    return GrammarResponse(
        errors=errors,
        inference_ms=(time.time() - t0) * 1000,
    )


@app.post("/cefr/predict", response_model=CefrResponse)
def cefr_predict(input: TextInput):
    if cefr_model is None:
        raise HTTPException(503, "CEFR model not loaded")

    t0 = time.time()

    inputs = cefr_tokenizer(
        input.text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    with torch.no_grad():
        outputs = cefr_model(**inputs)

    probs = torch.softmax(outputs.logits, dim=-1)[0]
    pred_id = probs.argmax().item()
    pred_label = cefr_model.config.id2label[pred_id]
    confidence = probs[pred_id].item()

    all_levels = {
        cefr_model.config.id2label[i]: round(probs[i].item(), 4)
        for i in range(len(probs))
    }

    return CefrResponse(
        predicted_level=pred_label,
        confidence=round(confidence, 4),
        all_levels=all_levels,
        inference_ms=(time.time() - t0) * 1000,
    )


# ─── Helpers ───────────────────────────────────────────────────────────────────


def parse_gector_label(label: str) -> tuple[Optional[str], Optional[str]]:
    """Parse GECToR tag into (error_type, correction)."""
    if label.startswith("$REPLACE_"):
        return ("replacement", label[len("$REPLACE_"):])
    if label.startswith("$APPEND_"):
        return ("insertion", label[len("$APPEND_"):])
    if label == "$DELETE":
        return ("deletion", None)
    if label.startswith("$TRANSFORM_"):
        return ("transformation", label[len("$TRANSFORM_"):])
    if label.startswith("$MERGE_"):
        return ("merge", None)
    return (label, None)
