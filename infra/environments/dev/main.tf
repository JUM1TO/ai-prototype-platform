locals {
  name                 = "${var.project_name}-dev"
  artifact_bucket_name = "${var.project_name}-artifacts"
  iam_name             = replace(var.project_name, "-", "_")

  common_tags = {
    Project     = var.project_name
    Environment = "dev"
    ManagedBy   = "terraform"
    ExpiresAt   = var.expires_at
  }
}

data "oci_identity_availability_domains" "available" {
  compartment_id = var.tenancy_ocid
}

data "oci_objectstorage_namespace" "current" {
  compartment_id = var.compartment_ocid
}

data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_objectstorage_bucket" "artifacts" {
  compartment_id = var.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.current.namespace
  name           = local.artifact_bucket_name
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
  versioning     = "Enabled"
  freeform_tags  = local.common_tags
}

resource "oci_objectstorage_object_lifecycle_policy" "artifacts" {
  bucket    = oci_objectstorage_bucket.artifacts.name
  namespace = data.oci_objectstorage_namespace.current.namespace

  rules {
    action      = "DELETE"
    is_enabled  = true
    name        = "delete-deployment-archives-after-14-days"
    target      = "objects"
    time_amount = "14"
    time_unit   = "DAYS"

    object_name_filter {
      inclusion_prefixes = ["deployments/"]
    }
  }

  rules {
    action      = "DELETE"
    is_enabled  = true
    name        = "delete-previous-archive-versions-after-3-days"
    target      = "previous-object-versions"
    time_amount = "3"
    time_unit   = "DAYS"

    object_name_filter {
      inclusion_prefixes = ["deployments/"]
    }
  }
}

resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.42.0.0/16"]
  display_name   = local.name
  dns_label      = "aiprotodev"
  freeform_tags  = local.common_tags
}

# Elimina las reglas predeterminadas, incluida la apertura de SSH del security list.
resource "oci_core_default_security_list" "main" {
  manage_default_resource_id = oci_core_vcn.main.default_security_list_id
  display_name               = "${local.name}-default-deny"
}

resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.name}-internet"
  enabled        = true
  freeform_tags  = local.common_tags
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.name}-public"
  freeform_tags  = local.common_tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = "10.42.1.0/24"
  display_name               = "${local.name}-public"
  dns_label                  = "public"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_default_security_list.main.id]
  freeform_tags              = local.common_tags
}

resource "oci_core_network_security_group" "platform" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${local.name}-web"
  freeform_tags  = local.common_tags
}

resource "oci_core_network_security_group_security_rule" "http" {
  network_security_group_id = oci_core_network_security_group.platform.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  description               = "HTTP público para la demostración"

  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
}

resource "oci_core_network_security_group_security_rule" "https" {
  network_security_group_id = oci_core_network_security_group.platform.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  description               = "HTTPS reservado para la siguiente etapa"

  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_network_security_group_security_rule" "egress" {
  network_security_group_id = oci_core_network_security_group.platform.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  description               = "Salida para Object Storage, IAM y actualizaciones"
}

resource "oci_core_instance" "platform" {
  availability_domain = data.oci_identity_availability_domains.available.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "${local.name}-platform"
  shape               = var.instance_shape
  freeform_tags       = local.common_tags

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_in_gbs
  }

  create_vnic_details {
    assign_public_ip = true
    display_name     = "${local.name}-platform"
    hostname_label   = "platform"
    nsg_ids          = [oci_core_network_security_group.platform.id]
    subnet_id        = oci_core_subnet.public.id
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.oracle_linux.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }

  instance_options {
    are_legacy_imds_endpoints_disabled = true
  }

  agent_config {
    are_all_plugins_disabled = false
    is_management_disabled   = false
    is_monitoring_disabled   = false

    plugins_config {
      desired_state = "ENABLED"
      name          = "Compute Instance Run Command"
    }
  }

  metadata = {
    user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
      artifact_bucket = oci_objectstorage_bucket.artifacts.name
      region          = var.oci_region
      solution_id     = var.solution_id
    }))
  }
}

resource "oci_identity_dynamic_group" "platform" {
  compartment_id = var.tenancy_ocid
  name           = "${local.iam_name}_dev_instances"
  description    = "Identidad de la VM para Run Command y lectura de artefactos."
  matching_rule  = "ALL {instance.id = '${oci_core_instance.platform.id}'}"
}

resource "oci_identity_policy" "platform" {
  compartment_id = var.tenancy_ocid
  name           = "${local.iam_name}_dev_instance_policy"
  description    = "Permisos mínimos de la VM para Run Command y Object Storage."

  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.platform.name} to use instance-agent-command-execution-family in compartment id ${var.compartment_ocid} where request.instance.id=target.instance.id",
    "Allow dynamic-group ${oci_identity_dynamic_group.platform.name} to read objects in compartment id ${var.compartment_ocid} where target.bucket.name='${oci_objectstorage_bucket.artifacts.name}'"
  ]
}

data "oci_core_vnic_attachments" "platform" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.platform.id
}

data "oci_core_vnic" "platform" {
  vnic_id = data.oci_core_vnic_attachments.platform.vnic_attachments[0].vnic_id
}
