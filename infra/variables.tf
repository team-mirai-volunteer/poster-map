variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"
}

# ============================================
# Normalizer Service Variables
# ============================================

variable "google_maps_api_key" {
  description = "Google Maps API Key for normalizer service"
  type        = string
  sensitive   = true
}