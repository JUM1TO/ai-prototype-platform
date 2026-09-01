variable "tenancy_ocid" {
  description = "OCID de la tenancy que contendrá el grupo dinámico y su política."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID del compartimento dedicado a esta plataforma."
  type        = string
}

variable "oci_region" {
  description = "Región home de la tenancy. Los recursos Always Free deben crearse ahí."
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

variable "instance_shape" {
  description = "Shape ARM elegible para Always Free."
  type        = string
  default     = "VM.Standard.A1.Flex"

  validation {
    condition     = var.instance_shape == "VM.Standard.A1.Flex"
    error_message = "Esta etapa sólo admite VM.Standard.A1.Flex para mantenerse en el diseño Always Free."
  }
}

variable "instance_ocpus" {
  description = "OCPU asignadas a la VM. El valor inicial conserva capacidad gratuita disponible."
  type        = number
  default     = 1

  validation {
    condition     = var.instance_ocpus >= 1 && var.instance_ocpus <= 2
    error_message = "Use entre 1 y 2 OCPU; la asignación Always Free vigente suma 2 OCPU A1 por tenancy."
  }
}

variable "instance_memory_in_gbs" {
  description = "Memoria de la VM en GiB."
  type        = number
  default     = 6

  validation {
    condition     = var.instance_memory_in_gbs >= 1 && var.instance_memory_in_gbs <= 12
    error_message = "Use entre 1 y 12 GiB; la asignación Always Free vigente suma 12 GiB A1 por tenancy."
  }
}

variable "boot_volume_size_in_gbs" {
  description = "Tamaño del boot volume. 50 GiB es el mínimo práctico y deja capacidad del bloque gratuito."
  type        = number
  default     = 50

  validation {
    condition     = var.boot_volume_size_in_gbs >= 50 && var.boot_volume_size_in_gbs <= 200
    error_message = "El boot volume debe estar entre 50 y 200 GiB. Revise que la suma total no rebase su cuota gratuita."
  }
}

variable "solution_id" {
  description = "Solución que carga inicialmente la API."
  type        = string
  default     = "document-review"
}

variable "expires_at" {
  description = "Fecha prevista de revisión o eliminación para control operativo."
  type        = string
  default     = "unset"
}
