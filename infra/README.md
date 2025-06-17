# Infrastructure as Code

This directory contains Terraform configuration for all project infrastructure.

## Structure

```
infra/
├── main.tf                 # Provider configuration
├── variables.tf            # Common variables
├── outputs.tf              # Output values
├── normalizer.tf           # Normalizer service resources
├── .env.example            # Environment variables template
└── terraform.tfvars.example # Terraform variables template
```

## Setup

1. **Authenticate with Google Cloud:**
   ```bash
   # Login to your Google account
   gcloud auth login
   
   # Set up application default credentials for Terraform
   gcloud auth application-default login
   
   # Set your project
   gcloud config set project PROJECT-ID
   gcloud auth application-default set-quota-project PROJECT-ID
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Set up variables:**
   ```bash
   # Option 1: Using environment variables
   cp .env.example .env
   # Edit .env with your values
   source .env

   # Option 2: Using terraform.tfvars
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Enable required APIs:**
   ```bash
   gcloud services enable maps-backend.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

## Deploy

```bash
# Preview changes
terraform plan

# Apply changes
terraform apply
```

## Resources Created

### Normalizer Service
- **Service Account**: `normalizer-sa` - Used by Cloud Run to access Google Maps API
- **Artifact Registry**: `normalizer` - Docker image repository
- **IAM Permissions**: Maps API access for the service account

## Adding New Services

To add a new service (e.g., pdf-reader):
1. Create `pdf-reader.tf` with service-specific resources
2. Follow the naming convention: prefix resources with service name
3. Add any new variables to `variables.tf`
4. Update outputs in `outputs.tf` if needed

## Cloud Run Deployment

After creating infrastructure, deploy the normalizer with:
```bash
gcloud run deploy csv-normalizer \
  --image gcr.io/YOUR-PROJECT/normalizer \
  --service-account=$(terraform output -raw normalizer_service_account_email) \
  --region=asia-northeast1
```
