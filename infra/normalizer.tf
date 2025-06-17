# ============================================
# CSV Normalizer Service Resources
# ============================================

# Service account for normalizer
resource "google_service_account" "normalizer" {
  account_id   = "normalizer-sa"
  display_name = "Normalizer Service Account"
  description  = "Service account for CSV normalizer Cloud Run service"
}


# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "normalizer" {
  location      = var.region
  repository_id = "normalizer"
  description   = "Docker repository for CSV normalizer service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}