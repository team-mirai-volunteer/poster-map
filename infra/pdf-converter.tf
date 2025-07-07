
resource "google_service_account" "pdf_converter" {
  account_id   = "pdf-converter-sa"
  display_name = "PDF Converter Service Account"
  description  = "Service account for PDF converter Cloud Run service"
}

# Create the Secret Manager secret
resource "google_secret_manager_secret" "openrouter_api_key" {
  secret_id = "openrouter-api-key"

  replication {
    auto {}
  }
}

# Create a secret version with the actual API key
resource "google_secret_manager_secret_version" "openrouter_api_key" {
  secret      = google_secret_manager_secret.openrouter_api_key.id
  secret_data = var.openrouter_api_key
}

resource "google_secret_manager_secret_iam_member" "pdf_converter_openrouter_key" {
  secret_id = google_secret_manager_secret.openrouter_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_converter.email}"

  depends_on = [
    google_service_account.pdf_converter,
    google_secret_manager_secret.openrouter_api_key
  ]
}

# Grant the default compute service account access to the secret
resource "google_secret_manager_secret_iam_member" "compute_sa_openrouter_key" {
  secret_id = google_secret_manager_secret.openrouter_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"

  depends_on = [google_secret_manager_secret.openrouter_api_key]
}

resource "google_artifact_registry_repository" "pdf_converter" {
  location      = var.region
  repository_id = "pdf-converter"
  description   = "Docker repository for PDF converter service"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

