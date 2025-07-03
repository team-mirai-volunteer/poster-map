# ============================================
# ============================================

resource "google_service_account" "map2csv" {
  account_id   = "map2csv-sa"
  display_name = "Map2CSV Service Account"
  description  = "Service account for webtool map2csv Cloud Run service"
}


# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "map2csv" {
  location      = var.region
  repository_id = "map2csv"
  description   = "Docker repository for webtool map2csv service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}
