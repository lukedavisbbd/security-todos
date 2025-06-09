#!/bin/bash
set -e


BACKEND_ECR_URL=958933916692.dkr.ecr.af-south-1.amazonaws.com/todo-app-dev-backend


# Set image tag
IMAGE_TAG=$(date +%s)

# Login to ECR
REGISTRY_URL=$(echo $BACKEND_ECR_URL | cut -d'/' -f1)
aws ecr get-login-password --region af-south-1 | \
    docker login --username AWS --password-stdin $REGISTRY_URL

# Build and push
docker build -f backend.Dockerfile -t todo-app-backend .
docker tag todo-app-backend:latest $BACKEND_ECR_URL:$IMAGE_TAG
docker push $BACKEND_ECR_URL:$IMAGE_TAG

# Update ECS
cd infrastructure
terraform apply -auto-approve -var="backend_image=$BACKEND_ECR_URL:$IMAGE_TAG"

# Force deployment
aws ecs update-service \
    --cluster todo-app-dev-cluster \
    --service todo-app-dev-backend \
    --force-new-deployment \
    --region af-south-1

echo "Deployed: $BACKEND_ECR_URL:$IMAGE_TAG"