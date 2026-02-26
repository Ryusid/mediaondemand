#!/bin/bash
set -e

# --- Configuration ---
AWS_REGION="eu-west-1"
AWS_ACCOUNT_ID="210037055433"
PROJECT_NAME="mediaondemand"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "🚀 Starting Local Build & Push Process..."

# 1. Login to ECR
echo "🔑 Logging into AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${REGISTRY}

# 2. Build & Push Frontend (The heavy one)
echo "📦 Building Frontend (Nginx)..."
docker build -t ${REGISTRY}/${PROJECT_NAME}/nginx:latest ./frontend
echo "⬆️ Pushing Frontend to ECR..."
docker push ${REGISTRY}/${PROJECT_NAME}/nginx:latest

# 3. Build & Push Catalog Service
echo "📦 Building Catalog Service..."
docker build -t ${REGISTRY}/${PROJECT_NAME}/catalog-service:latest ./services/catalog-service
echo "⬆️ Pushing Catalog Service to ECR..."
docker push ${REGISTRY}/${PROJECT_NAME}/catalog-service:latest

echo "✅ All images pushed to ECR!"
echo "--------------------------------------------------"
echo "Next step: Log in to your EC2 and run: docker-compose pull && docker-compose up -d"
