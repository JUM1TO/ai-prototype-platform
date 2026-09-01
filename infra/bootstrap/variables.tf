variable "compartment_ocid" {
  description = "OCID del compartimento dedicado a la plataforma."
  type        = string
}

variable "oci_region" {
  description = "Región home de la tenancy, donde viven los recursos Always Free."
  type        = string
}

variable "oci_profile" {
  description = "Perfil local de OCI CLI usado por Terraform."
  type        = string
  default     = "AI_PROTOTYPES"
}

variable "project_name" {
  description = "Prefijo estable para los recursos."
  type        = string
  default     = "ai-prototypes"
}
