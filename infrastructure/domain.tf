data "aws_route53_zone" "main" {
  name         = "todosecuritylevelup.com"
  private_zone = false
}

data "aws_acm_certificate" "main" {
  domain   = "todosecuritylevelup.com"
  statuses = ["ISSUED"]
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "todosecuritylevelup.com"
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.todosecuritylevelup.com"
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}