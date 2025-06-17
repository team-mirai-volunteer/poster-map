# Normalizer outputs
output "normalizer_service_account_email" {
  value       = google_service_account.normalizer.email
  description = "Email of the normalizer service account"
}

output "normalizer_api_key_secret_name" {
  value       = google_secret_manager_secret.normalizer_maps_api_key_auto.secret_id
  description = "Secret Manager secret name for the auto-generated API key"
}