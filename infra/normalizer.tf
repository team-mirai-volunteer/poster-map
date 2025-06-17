# ============================================
# CSV Normalizer Service Resources
# ============================================

# Service account for normalizer
resource "google_service_account" "normalizer" {
  account_id   = "normalizer-sa"
  display_name = "Normalizer Service Account"
  description  = "Service account for CSV normalizer Cloud Run service"
}

# Grant the service account permission to invoke Google Maps services
# Note: The Maps API doesn't have specific IAM roles - it uses project-level API enablement
# The service account just needs to be from the project where Maps API is enabled

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "normalizer" {
  location      = var.region
  repository_id = "normalizer"
  description   = "Docker repository for CSV normalizer service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}