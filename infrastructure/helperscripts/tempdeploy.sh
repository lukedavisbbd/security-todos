#!/bin/bash
set -e

AWS_REGION="af-south-1"
PROJECT_NAME="todo-app"
ENVIRONMENT="dev"

echo "Starting deployment to AWS ECS..."

echo "Initializing Terraform..."
cd ../
terraform init

echo "Creating AWS infrastructure and secrets..."
terraform apply -auto-approve

BACKEND_ECR_URL=$(terraform output -raw backend_ecr_repository_url)
FRONTEND_ECR_URL=$(terraform output -raw frontend_ecr_repository_url)

echo "ECR repositories created:"
echo "Backend: $BACKEND_ECR_URL"
echo "Frontend: $FRONTEND_ECR_URL"

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BACKEND_ECR_URL

echo "Building and pushing backend image..."
cd ../
docker build -f backend.Dockerfile -t $PROJECT_NAME-backend .
docker tag $PROJECT_NAME-backend:latest $BACKEND_ECR_URL:latest
docker push $BACKEND_ECR_URL:latest

echo "Building and pushing frontend image..."
docker build -f frontend.Dockerfile -t $PROJECT_NAME-frontend .
docker tag $PROJECT_NAME-frontend:latest $FRONTEND_ECR_URL:latest
docker push $FRONTEND_ECR_URL:latest

echo "Updating ECS services with new images..."
cd infrastructure
terraform apply -auto-approve \
  -var="backend_image=$BACKEND_ECR_URL:latest" \
  -var="frontend_image=$FRONTEND_ECR_URL:latest"

echo "Waiting for RDS to be available..."
aws rds wait db-instance-available --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db --region $AWS_REGION

# echo "Force ECS service update to deploy new images..."
# aws ecs update-service \
#   --cluster ${PROJECT_NAME}-${ENVIRONMENT}-cluster \
#   --service ${PROJECT_NAME}-${ENVIRONMENT}-backend \
#   --force-new-deployment \
#   --region $AWS_REGION

ALB_DNS=$(terraform output -raw alb_dns_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

echo "Available at: http://$ALB_DNS"
echo "API endpoint: http://$ALB_DNS/api/"
echo "   - ECS Console: https://af-south-1.console.aws.amazon.com/ecs/home?region=af-south-1#/clusters/$PROJECT_NAME-$ENVIRONMENT-cluster/services"
echo "Database: $RDS_ENDPOINT"