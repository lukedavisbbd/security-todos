#!/bin/bash
set -e

AWS_REGION="af-south-1"
PROJECT_NAME="my-app"
ENVIRONMENT="dev"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Starting deployment to AWS ECS..."

echo "Initializing Terraform..."
cd ../
terraform init

echo "Creating AWS infrastructure..."
terraform apply -auto-approve \
  -var="master_key_2fa=${MASTER_KEY_2FA}" \
  -var="jwt_secret=${JWT_SECRET}" \
  -var="db_host=${DB_HOST}" \
  -var="db_database=${DB_DATABASE}" \
  -var="db_user=${DB_USER}" \
  -var="db_password=${DB_PASSWORD}"

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

echo "Updating ECS services..."
cd infrastructure
terraform apply -auto-approve  -auto-approve \
  -var="backend_image=$BACKEND_ECR_URL:latest" \
  -var="frontend_image=$FRONTEND_ECR_URL:latest" \
  -var="master_key_2fa=${MASTER_KEY_2FA}" \
  -var="jwt_secret=${JWT_SECRET}" \
  -var="db_host=${DB_HOST}" \
  -var="db_database=${DB_DATABASE}" \
  -var="db_user=${DB_USER}" \
  -var="db_password=${DB_PASSWORD}"
  
ALB_DNS=$(terraform output -raw alb_dns_name)

echo "available at: http://$ALB_DNS"
echo "API endpoint: http://$ALB_DNS/api/"
echo "   - ECS Console: https://af-south-1.console.aws.amazon.com/ecs/home?region=af-south-1#/clusters/$PROJECT_NAME-$ENVIRONMENT-cluster/services"
echo "   - ALB Console: https://af-south-1.console.aws.amazon.com/ec2/v2/home?region=af-south-1#LoadBalancers:"