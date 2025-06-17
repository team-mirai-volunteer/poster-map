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

output "pdf_converter_service_url" {
  description = "URL of the deployed PDF converter service"
  value       = try(google_cloud_run_service.pdf_converter.status[0].url, "")
}
