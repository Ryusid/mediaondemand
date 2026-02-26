# MediaOnDemand Platform

A cloud-native media-on-demand platform built with **microservices architecture** on **AWS**, using **Terraform** for infrastructure as code and **Jenkins** for CI/CD.

> University project — CFA INSTA 2025/2026 — Architectures modernes & cloud

## Architecture

The platform delivers on-demand video and ebook content to authenticated users, leveraging AWS managed services within the **Free Tier**.

### Tech Stack

| Layer | Technology |
|---|---|
| Cloud | AWS (Free Tier) |
| IaC | Terraform |
| CI/CD | Jenkins |
| Auth | AWS Cognito |
| Compute | EC2 t2.micro + Docker Compose |
| Database | RDS PostgreSQL (with full-text search) |
| Storage | S3 + CloudFront |
| Video Processing | Lambda + FFmpeg |
| Messaging | SQS + SNS |
| API | API Gateway |
| Observability | CloudWatch |

### Microservices

| Service | Port | Description |
|---|---|---|
| user-service | 3001 | User profiles via Cognito |
| catalog-service | 3002 | Content metadata CRUD |
| upload-service | 3003 | S3 presigned URL generation |
| search-service | 3004 | Full-text search (PostgreSQL) |
| streaming-service | 3005 | Content delivery URLs |
| nginx | 3000 | Reverse proxy |

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with Free Tier account
- [Docker](https://www.docker.com/) & Docker Compose
- An AWS EC2 key pair

## Quick Start

### 1. Configure Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

### 3. Configure Services

```bash
cd services
cp .env.example .env
# Fill .env with Terraform output values
```

### 4. Run Locally (for development)

```bash
cd services
docker-compose up --build
```

### 5. Access

- **API**: http://localhost:3000
- **Jenkins**: http://<ec2-ip>:8080

## Project Structure

```
mediaondemand/
├── terraform/          # Infrastructure as Code
│   ├── main.tf         # Root module
│   └── modules/        # VPC, Cognito, S3, RDS, EC2, Lambda, API GW, CloudWatch
├── services/           # Microservices (Docker Compose)
│   ├── user-service/
│   ├── catalog-service/
│   ├── upload-service/
│   ├── search-service/
│   └── streaming-service/
├── lambda/             # Serverless functions
│   ├── video-transcoder/
│   └── ebook-converter/
├── jenkins/            # CI/CD pipeline
│   └── Jenkinsfile
└── docs/               # Architecture documentation
```

## Cost

All services are within the **AWS Free Tier** — $0/month for development and demo usage.

## License

This project is for educational purposes (CFA INSTA 2025/2026).
