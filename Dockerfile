# Use a slim Python runtime
FROM python:3.11-slim

# Do not buffer Python stdout/stderr; no pip cache
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

# Copy your code & the entryPoint
COPY . .
COPY entryPoint.sh /app/entryPoint.sh
RUN chmod +x /app/entryPoint.sh

# Expose the port your app listens on
ARG PORT=8080
EXPOSE ${PORT}

# Run the entryPoint
ENTRYPOINT ["/app/entryPoint.sh"]
