
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for OCR, PDF processing,
# Playwright, and ODBC-based database connectivity.

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    tesseract-ocr \
    curl \
    ca-certificates \
    && . /etc/os-release \
    && curl -fsSL "https://packages.microsoft.com/config/debian/${VERSION_ID%%.*}/packages-microsoft-prod.deb" \
       -o /tmp/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && rm /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for better build caching.
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium and its Linux dependencies for Playwright.
RUN python -m playwright install --with-deps chromium

# Copy backend source code.
COPY . .

# Create a directory for uploaded files.
RUN mkdir -p /app/uploads

EXPOSE 5001

CMD ["python", "app.py"]