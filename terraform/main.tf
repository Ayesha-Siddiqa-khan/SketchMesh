terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project           = "SketchMesh"
      Environment       = var.environment
      ManagedBy         = "TerraPilot"
      TerraPilotProject = "SketchMesh"
    }
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  resource_prefix = (var.project_name == var.environment || endswith(var.project_name, "-dev")) ? var.project_name : "${var.project_name}-${var.environment}"

  # Availability Zones
  azs = slice(data.aws_availability_zones.available.names, 0, max(length(var.public_subnet_cidrs), length(var.private_subnet_cidrs)))

  public_subnet_ids  = [for s in aws_subnet.public : s.id]
  private_subnet_ids = [for s in aws_subnet.private : s.id]

  ec2_key_name = var.key_pair_mode == "existing" ? var.existing_key_pair_name : (var.key_pair_mode == "create" ? aws_key_pair.main[0].key_name : null)

  ec2_security_group_ids           = [aws_security_group.ec2_consolidated[0].id]
  ec2_security_group_count         = length(local.ec2_security_group_ids)
  ec2_security_group_rules_product = local.ec2_security_group_count * 10

  ec2_instances_expanded = {
    for idx, inst in var.ec2_instances : "${inst.name}-${idx}" => {
      name                = inst.name
      instance_type       = inst.instance_type
      subnet_type         = inst.subnet_type
      associate_public_ip = inst.associate_public_ip
      root_volume_size    = inst.root_volume_size
      root_volume_type    = inst.root_volume_type
      encrypt_root_volume = inst.encrypt_root_volume
      role                = inst.role
    }
  }

  ecr_repository_url = aws_ecr_repository.main.repository_url
  ecr_repository_arn = aws_ecr_repository.main.arn
}

# ------------------------------------------------------------------------------
# VPC and Networking
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.resource_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.resource_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index % length(local.azs)]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.resource_prefix}-public-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index % length(local.azs)]

  tags = {
    Name = "${local.resource_prefix}-private-${count.index + 1}"
    Type = "Private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${local.resource_prefix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ------------------------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------------------------
resource "aws_security_group" "ec2_consolidated" {
  count       = 1
  name        = "${local.resource_prefix}-ec2-consolidated"
  description = "Consolidated security group for EC2 instances and Kubernetes node communication"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Kubernetes API Server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Internal VPC traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.resource_prefix}-sg"
  }
}

# ------------------------------------------------------------------------------
# Key Pair (if created)
# ------------------------------------------------------------------------------
resource "aws_key_pair" "main" {
  count      = var.key_pair_mode == "create" && var.public_key != "" ? 1 : 0
  key_name   = var.key_pair_name
  public_key = var.public_key
}

# ------------------------------------------------------------------------------
# IAM Roles & Instance Profiles
# ------------------------------------------------------------------------------
resource "aws_iam_role" "worker_ec2_ecr_pull" {
  name = "${local.resource_prefix}-worker-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.worker_ec2_ecr_pull.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.worker_ec2_ecr_pull.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "worker_ec2_ecr_pull" {
  name = "${local.resource_prefix}-worker-instance-profile"
  role = aws_iam_role.worker_ec2_ecr_pull.name
}

resource "aws_iam_role" "github_actions_oidc" {
  name = "${local.resource_prefix}-github-actions-oidc"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = var.github_oidc_audience
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = var.github_repository != "" ? "repo:${var.github_repository}:*" : "repo:Ayesha-Siddiqa-khan/SketchMesh:*"
          }
        }
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# EC2 Instances
# ------------------------------------------------------------------------------
resource "aws_instance" "main" {
  for_each = local.ec2_instances_expanded

  ami                    = data.aws_ami.ubuntu.id
  instance_type          = each.value.instance_type
  key_name               = local.ec2_key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2_consolidated[0].id]
  iam_instance_profile   = aws_iam_instance_profile.worker_ec2_ecr_pull.name

  associate_public_ip_address = each.value.associate_public_ip

  root_block_device {
    volume_size           = each.value.root_volume_size
    volume_type           = each.value.root_volume_type
    encrypted             = each.value.encrypt_root_volume
    delete_on_termination = true
  }

  tags = {
    Name = "${local.resource_prefix}-${each.key}"
    Role = each.value.role
  }
}

# ------------------------------------------------------------------------------
# S3 Buckets
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "bootstrap" {
  bucket        = "${lower(local.resource_prefix)}-bootstrap-${random_id.suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket" "postgres_backups" {
  bucket        = var.postgres_backup_bucket_name != "" ? var.postgres_backup_bucket_name : "${lower(local.resource_prefix)}-pg-backup-${random_id.suffix.hex}"
  force_destroy = true
}

# ------------------------------------------------------------------------------
# ECR Repository
# ------------------------------------------------------------------------------
resource "aws_ecr_repository" "main" {
  name                 = var.ecr_repository_name
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }
}

# ------------------------------------------------------------------------------
# Optional NLB for Ingress
# ------------------------------------------------------------------------------
resource "aws_lb" "ingress_nginx" {
  count              = var.enable_kubernetes_ingress_nlb ? 1 : 0
  name               = "${local.resource_prefix}-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = [for s in aws_subnet.public : s.id]

  tags = {
    Name = "${local.resource_prefix}-nlb"
  }
}
