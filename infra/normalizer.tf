# ============================================
# CSV Normalizer Service Resources
# ============================================

# Service account for normalizer
resource "google_service_account" "normalizer" {
  account_id   = "normalizer-sa"
  display_name = "Normalizer Service Account"
  description  = "Service account for CSV normalizer Cloud Run service"
}

# Grant the service account permission to use Google Maps API
resource "google_project_iam_member" "normalizer_maps_user" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.normalizer.email}"
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "normalizer" {
  location      = var.region
  repository_id = "normalizer"
  description   = "Docker repository for CSV normalizer service"
  format        = "DOCKER"
}