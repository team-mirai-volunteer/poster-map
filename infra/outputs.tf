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

# Route Optimizer outputs
output "route_optimizer_service_account_email" {
  value       = google_service_account.route_optimizer.email
  description = "Email of the route optimizer service account"
}

output "route_optimizer_bucket_name" {
  value       = google_storage_bucket.route_optimizer_results.name
  description = "Name of the GCS bucket for route optimizer results"
}

