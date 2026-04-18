# NLP Sidecar Service

FastAPI service chứa GECToR (grammar error detection) + CEFR Classifier (level prediction).
Laravel backend gọi qua HTTP.

## Quick start

```bash
cd apps/nlp-sidecar
docker build -t vstep-nlp .
docker run -p 8082:8000 vstep-nlp
```

## Endpoints

- `POST /grammar/check` — GECToR token-level error detection
- `POST /cefr/predict` — CEFR level classification (A1-C2)
- `GET /health` — readiness check

## Models

- GECToR: `Meyssa/gector-large-2024` (ONNX quantized, ~400MB)
- CEFR: `dksysd/cefr-classifier` (safetensors, ~500MB)
