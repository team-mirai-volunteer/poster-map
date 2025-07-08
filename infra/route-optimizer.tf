# ============================================
# Route Optimizer Service Resources
# ============================================

# Service account for route optimizer
resource "google_service_account" "route_optimizer" {
  account_id   = "route-optimizer-sa"
  display_name = "Route Optimizer Service Account"
  description  = "Service account for route optimizer Cloud Run service"
}

# OpenRouteService APIキーはユーザー入力必須のため、Secret Manager関連リソースは削除

# GCS bucket for storing optimization results
resource "google_storage_bucket" "route_optimizer_results" {
  name          = "${var.project_id}-route-optimizer-results"
  location      = var.region
  storage_class = "STANDARD"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
  
  uniform_bucket_level_access = true
}

# Grant route optimizer service account access to the bucket
resource "google_storage_bucket_iam_member" "route_optimizer_bucket_access" {
  bucket = google_storage_bucket.route_optimizer_results.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.route_optimizer.email}"
  
  depends_on = [google_service_account.route_optimizer]
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "route_optimizer" {
  location      = var.region
  repository_id = "route-optimizer"
  description   = "Docker repository for route optimizer service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}