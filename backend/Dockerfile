FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for image processing (Pillow/System)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure upload directories exist
RUN mkdir -p uploads/avatars uploads/covers uploads/logo uploads/favs uploads/files/og-preview

EXPOSE 8000

# uvicorn with proxy headers support for OAuth stability
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
