output "instance_id" {
  description = "OCID de la VM usado por GitHub Actions."
  value       = oci_core_instance.platform.id
}

output "public_ip" {
  description = "IP pública dinámica de la demostración."
  value       = data.oci_core_vnic.platform.public_ip_address
}

output "site_url" {
  description = "URL HTTP inicial. Se reemplazará por dominio y HTTPS en otro incremento."
  value       = "http://${data.oci_core_vnic.platform.public_ip_address}"
}

output "oci_namespace" {
  description = "Namespace de Object Storage."
  value       = data.oci_objectstorage_namespace.current.namespace
}

output "artifact_bucket" {
  description = "Bucket privado donde GitHub publica los archivos OCI por SHA."
  value       = oci_objectstorage_bucket.artifacts.name
}

output "run_command_dynamic_group" {
  description = "Grupo dinámico que autoriza al agente de la VM."
  value       = oci_identity_dynamic_group.platform.name
}
