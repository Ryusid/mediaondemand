# --- Auth Module ---
# AWS Cognito User Pool (always free: 50K MAUs)

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Auto-verify email
  auto_verified_attributes = ["email"]

  # Schema
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Name = "${var.project_name}-user-pool"
  }
}

# App client (for the frontend/API)
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = var.callback_urls
  supported_identity_providers         = ["COGNITO"]
}

# Cognito domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${random_string.cognito_domain.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "random_string" "cognito_domain" {
  length  = 8
  special = false
  upper   = false
}
