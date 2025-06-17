# ============================================
# Google Maps API Key with Restrictions
# ============================================

# Create an API key specifically for the normalizer service
resource "google_apikeys_key" "normalizer_maps_key" {
  name         = "normalizer-maps-api-key"
  display_name = "Normalizer Google Maps API Key"
  project      = var.project_id

  restrictions {
    # Restrict to specific APIs
    api_targets {
      service = "geocoding-backend.googleapis.com"
    }
    
    # Optional: Restrict to specific IP addresses (for Cloud Run)
    # server_key_restrictions {
    #   allowed_ips = ["YOUR_CLOUD_RUN_IP"]
    # }
  }
}

# Store the API key in Secret Manager
resource "google_secret_manager_secret" "normalizer_maps_api_key_auto" {
  secret_id = "google-maps-api-key-auto"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "normalizer_maps_api_key_auto" {
  secret = google_secret_manager_secret.normalizer_maps_api_key_auto.id
  secret_data = google_apikeys_key.normalizer_maps_key.key_string
}

# Grant the service account permission to access the auto-generated secret
resource "google_secret_manager_secret_iam_member" "normalizer_secret_accessor_auto" {
  secret_id = google_secret_manager_secret.normalizer_maps_api_key_auto.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.normalizer.email}"
}

# Output the key name for reference
output "normalizer_api_key_name" {
  value = google_apikeys_key.normalizer_maps_key.name
  description = "Name of the auto-generated API key"
}