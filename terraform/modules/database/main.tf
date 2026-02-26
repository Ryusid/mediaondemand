# --- Database Module ---
# RDS PostgreSQL free tier (db.t3.micro, 750 hrs/mo, 20GB)

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "15"

  # Free tier instance
  instance_class        = "db.t3.micro"
  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp2"

  # Credentials
  db_name  = replace(var.project_name, "-", "_")
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_security_group_id]
  publicly_accessible    = false

  # Backup (free with instance)
  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Other
  skip_final_snapshot = true
  multi_az            = false

  tags = {
    Name = "${var.project_name}-postgresql"
  }
}
