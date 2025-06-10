output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name - your app URL"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.main.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend deployment"
  value       = aws_s3_bucket.frontend.id
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend images"
  value       = aws_ecr_repository.backend.repository_url
}

output "alb_dns_name" {
  description = "ALB DNS name (for debugging)"
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "Your application URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}