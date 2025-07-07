# Normalizer outputs
output "normalizer_service_account_email" {
  value       = google_service_account.normalizer.email
  description = "Email of the normalizer service account"
}

# PDF Converter outputs
output "pdf_converter_service_account_email" {
  value       = google_service_account.pdf_converter.email
  description = "Email of the PDF converter service account"
}

output "map2csv_service_account_email" {
  value       = google_service_account.map2csv.email
  description = "Email of the map2csv service account"
}

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github_actions.name
  description = "Workload Identity Provider for GitHub Actions"
}

output "pdf_converter_artifact_registry" {
  value       = google_artifact_registry_repository.pdf_converter.name
  description = "PDF converter Artifact Registry repository name"
}

