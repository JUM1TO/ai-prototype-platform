output "state_bucket" {
  description = "Nombre del bucket versionado para los estados de Terraform."
  value       = oci_objectstorage_bucket.terraform_state.name
}

output "object_storage_namespace" {
  description = "Namespace requerido por el backend nativo de OCI."
  value       = data.oci_objectstorage_namespace.current.namespace
}

output "region" {
  description = "Región del bucket de estado."
  value       = var.oci_region
}
