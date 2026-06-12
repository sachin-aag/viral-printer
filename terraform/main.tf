terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# Random suffix so bucket name is globally unique
resource "random_id" "suffix" {
  byte_length = 4
}

# ── S3 Bucket ────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "media" {
  bucket = "viralprinter-media-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}

# ── IAM User (app credentials) ───────────────────────────────────────────────

resource "aws_iam_user" "viralprinter" {
  name = "viralprinter-app"
  tags = { Project = "viralprinter" }
}

resource "aws_iam_access_key" "viralprinter" {
  user = aws_iam_user.viralprinter.name
}

resource "aws_iam_user_policy" "viralprinter" {
  name = "viralprinter-policy"
  user = aws_iam_user.viralprinter.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject",
        ]
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*",
        ]
      },
      {
        Sid      = "PollyTTS"
        Effect   = "Allow"
        Action   = ["polly:SynthesizeSpeech"]
        Resource = "*"
      },
    ]
  })
}

# ── Outputs (copy these into .env.local) ─────────────────────────────────────

output "AWS_ACCESS_KEY_ID" {
  value = aws_iam_access_key.viralprinter.id
}

output "AWS_SECRET_ACCESS_KEY" {
  value     = aws_iam_access_key.viralprinter.secret
  sensitive = true
}

output "AWS_REGION" {
  value = var.aws_region
}

output "AWS_S3_BUCKET" {
  value = aws_s3_bucket.media.bucket
}
