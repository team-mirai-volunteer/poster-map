# Normalizer outputs
output "normalizer_service_account_email" {
  value       = google_service_account.normalizer.email
  description = "Email of the normalizer service account"
}