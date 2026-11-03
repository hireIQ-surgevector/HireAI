
FROM python:3.12-slim-bookworm

WORKDIR /app

# Install runtime dependencies for OCR, document conversion,
# Chromium-based scraping, and SQL Server connectivity.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    curl \
    ca-certificates \
    libreoffice-writer \
    fonts-liberation \
    && . /etc/os-release \
    && curl -fsSL "https://packages.microsoft.com/config/debian/${VERSION_ID%%.*}/packages-microsoft-prod.deb" \
       -o /tmp/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && rm /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

ENV LIBREOFFICE_PATH=/usr/bin/soffice \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements-runtime.txt .

RUN pip install --no-cache-dir --timeout 300 --retries 10 \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements-runtime.txt

# Install Chromium and its Linux dependencies for Playwright
RUN python -m playwright install --with-deps chromium

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]