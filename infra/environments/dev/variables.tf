variable "project_name" {
  description = "Nombre usado para identificar los recursos."
  type        = string
}

variable "aws_region" {
  description = "Región de despliegue."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Instancia inicial elegible para AWS Free Tier."
  type        = string
  default     = "t3.micro"
}

variable "expires_at" {
  description = "Fecha prevista de eliminación para control de costos."
  type        = string
  default     = "unset"
}
