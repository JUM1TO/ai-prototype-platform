terraform {
  required_version = ">= 1.12.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 8.27"
    }
  }
}

provider "oci" {
  region              = var.oci_region
  config_file_profile = var.oci_profile
}
