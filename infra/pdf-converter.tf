
resource "google_service_account" "pdf_converter" {
  account_id   = "pdf-converter-sa"
  display_name = "PDF Converter Service Account"
  description  = "Service account for PDF converter Cloud Run service"
}

resource "google_secret_manager_secret_iam_member" "pdf_converter_openrouter_key" {
  secret_id = "openrouter-api-key"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.pdf_converter.email}"
  
  depends_on = [google_service_account.pdf_converter]
}

resource "google_artifact_registry_repository" "pdf_converter" {
  location      = var.region
  repository_id = "pdf-converter"
  description   = "Docker repository for PDF converter service"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_service" "pdf_converter" {
  name     = "pdf-converter"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.pdf_converter.email
      
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/pdf-converter/pdf-converter:latest"
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
        
        env {
          name = "OPENROUTER_API_KEY"
          value_from {
            secret_key_ref {
              name = "openrouter-api-key"
              key  = "latest"
            }
          }
        }
      }
      
      timeout_seconds = 3600
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_service_account.pdf_converter,
    google_artifact_registry_repository.pdf_converter
  ]
}

resource "google_cloud_run_service_iam_member" "pdf_converter_public" {
  service  = google_cloud_run_service.pdf_converter.name
  location = google_cloud_run_service.pdf_converter.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
