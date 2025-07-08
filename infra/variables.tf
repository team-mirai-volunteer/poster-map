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

variable "openrouter_api_key" {
  description = "OpenRouter API Key for PDF converter"
  type        = string
  sensitive   = true
}

variable "openrouteservice_api_key" {
  description = "OpenRouteService API Key for route optimizer"
  type        = string
  sensitive   = true
}