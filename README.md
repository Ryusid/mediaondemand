# MediaOnDemand Platform

A cloud-native media-on-demand platform built with a **microservices architecture** on **AWS**. It utilizes **Terraform** for Infrastructure as Code and **GitHub Actions** for a fully serverless CI/CD deployment pipeline.

> University project — CFA INSTA 2025/2026 — Architectures modernes & cloud

## 🌟 Key Features
- **Serverless Media Processing**: Automated Transcoding for Videos and PDF/EPUB conversion using AWS Lambda and FFmpeg.
- **Native Ebook & Video Player**: Integrated custom React video player and native EPUB/PDF reader.
- **Secure Authentication**: AWS Cognito integration with Email/Code verification and JWT authorization.
- **High Performance Delivery**: Content served globally via CloudFront CDN.
- **Zero-Downtime Deployment**: Pure SSH GitHub Actions pipeline for instant container updates.

## 🏗️ Architecture

The platform delivers on-demand video and ebook content to authenticated users, leveraging AWS managed services entirely within the **Free Tier**.

### Tech Stack

| Layer | Technology |
|---|---|
| **Cloud** | AWS (Free Tier) |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions (Pure SSH Deploy) |
| **Auth** | AWS Cognito |
| **Frontend**| React, Vite, TailwindCSS |
| **Compute** | EC2 t3.micro + Docker Compose |
| **Database**| RDS PostgreSQL (with full-text search) |
| **Storage** | S3 + CloudFront CDN |
| **Processing**| AWS Lambda + FFmpeg |
| **Messaging** | SQS + SNS |
| **API** | API Gateway + Nginx Reverse Proxy|

### Microservices

| Service | Port | Description |
|---|---|---|
| `nginx` | 3000 | Frontend UI and API Gateway Reverse Proxy |
| `user-service` | 3001 | User profiles and Cognito authentication synchronization |
| `catalog-service` | 3002 | Content metadata CRUD and PostgreSQL integration |
| `upload-service` | 3003 | Secure S3 Presigned URL generation for direct uploads |
| `search-service` | 3004 | Full-text search engine querying RDS |
| `streaming-service` | 3005 | Secure CDN URL signing for Media playback |

## 🚀 Deployment Guide

### 1. Provision Infrastructure
Run Terraform to create the VPC, EC2, RDS, S3, Cognito, and API Gateway resources.
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your AWS credentials and desired variables
terraform init
terraform apply
```

### 2. Configure GitHub Secrets
For the CI/CD pipeline to automatically deploy to your EC2 instance, add the following secrets to your GitHub Repository (`Settings > Secrets and variables > Actions`):

- `VITE_API_URL`: The public IP or API Gateway URL
- `VITE_COGNITO_USER_POOL_ID`: From Terraform output
- `VITE_COGNITO_CLIENT_ID`: From Terraform output
- `VITE_AWS_REGION`: e.g., `eu-west-1`
- `AWS_ACCESS_KEY_ID`: For backend services
- `AWS_SECRET_ACCESS_KEY`: For backend services
- `EC2_HOST`: The Public IP of your EC2 instance
- `SSH_PRIVATE_KEY`: The private `.pem` key to SSH into `ec2-user`

### 3. Push to Deploy
The `deploy.yml` workflow will automatically:
1. Detect which microservices changed.
2. Build and push optimized Docker images to GHCR.
3. SSH into the EC2 instance and run `docker-compose pull && docker-compose up -d`.

```bash
git add .
git commit -m "Deploy Infrastructure"
git push
```

## 💻 Local Development

1. Setup environment variables:
```bash
cd services
cp .env.example .env
# Fill .env with your Terraform output values
```

2. Start the backend services:
```bash
docker-compose up --build
```

3. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

```text
mediaondemand/
├── .github/workflows/  # CI/CD Deployment pipeline
├── frontend/           # React/Vite SPA Application
├── terraform/          # Infrastructure as Code (AWS)
│   └── modules/        # VPC, Cognito, S3, RDS, EC2, Lambda, API GW
├── services/           # Backend Microservices (Node.js/Docker)
│   ├── user-service/
│   ├── catalog-service/
│   ├── upload-service/
│   ├── search-service/
│   └── streaming-service/
└── lambda/             # Serverless AWS Lambda Handlers
    ├── video-transcoder/
    └── ebook-converter/
```

## 💰 Cost Analysis
All services and architectural decisions were specifically designed to operate within the **AWS Free Tier** parameters, resulting in a **$0/month** operational cost for development and typical academic demonstration usage.

## 📄 License
This project is for educational purposes (CFA INSTA 2025/2026).
