FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies in stages to handle complex builds
RUN pip install --no-cache-dir --upgrade pip wheel setuptools && \
    # Install numpy with a specific version known to work
    pip install --no-cache-dir numpy==1.23.5 && \
    # Install Cython first
    pip install --no-cache-dir 'Cython<3.0,>=0.29.0' && \
    # Install thinc dependencies first
    pip install --no-cache-dir \
        'blis==0.7.9' \
        'murmurhash==1.0.9' \
        'cymem==2.0.7' \
        'preshed==3.0.8' \
        'thinc==8.1.10' && \
    # Now install spaCy with a specific version
    pip install --no-cache-dir spacy==3.5.3 && \
    # Download the English model
    python -m spacy download en_core_web_sm && \
    # Finally install remaining requirements
    pip install --no-cache-dir -r requirements.txt

# Install playwright browsers (if needed)
RUN if grep -q "playwright" requirements.txt; then \
    pip install playwright && \
    playwright install chromium && \
    playwright install-deps chromium; \
    fi

# Copy application code
COPY . .

# Run as non-root user for better security
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
