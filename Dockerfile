FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for data persistence
RUN mkdir -p /app/data

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Use Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
