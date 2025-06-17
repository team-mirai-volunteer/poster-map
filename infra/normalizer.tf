# ============================================
# CSV Normalizer Service Resources
# ============================================

# Service account for normalizer
resource "google_service_account" "normalizer" {
  account_id   = "normalizer-sa"
  display_name = "Normalizer Service Account"
  description  = "Service account for CSV normalizer Cloud Run service"
}

# Secret for Google Maps API Key
resource "google_secret_manager_secret" "normalizer_google_maps_api_key" {
  secret_id = "google-maps-api-key"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "normalizer_google_maps_api_key" {
  secret = google_secret_manager_secret.normalizer_google_maps_api_key.id
  secret_data = var.google_maps_api_key
}

# Grant the service account permission to access the secret
resource "google_secret_manager_secret_iam_member" "normalizer_secret_accessor" {
  secret_id = google_secret_manager_secret.normalizer_google_maps_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.normalizer.email}"
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "normalizer" {
  location      = var.region
  repository_id = "normalizer"
  description   = "Docker repository for CSV normalizer service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}