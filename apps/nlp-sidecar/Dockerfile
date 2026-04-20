FROM python:3.11-slim

WORKDIR /app

# Install deps first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models at build time
RUN python -c "\
from huggingface_hub import snapshot_download; \
snapshot_download('dksysd/cefr-classifier', local_dir='/app/models/cefr-classifier'); \
snapshot_download('Meyssa/gector-large-2024', local_dir='/app/models/gector-large-2024')"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
