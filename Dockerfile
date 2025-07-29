FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for data persistence (if needed)
RUN mkdir -p /app/data

# Set environment variables for Google Cloud
ENV FLASK_ENV=production
ENV PORT=8080

# Expose the port that Cloud Run expects
EXPOSE 8080

# Use Gunicorn for production on Google Cloud
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
