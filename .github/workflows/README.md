# CI/CD Pipeline Documentation

This repository uses GitHub Actions for continuous integration and deployment to Google Cloud Run.

## Workflow Overview

The CI/CD pipeline (`ci-cd.yml`) performs the following:

### On Pull Requests and Pushes to main/master:
1. **Test Normalizer Service** - Runs Python integration tests

### On Push to main/master only:
2. **Deploy Map2CSV** - Builds and deploys to Cloud Run
3. **Deploy Normalizer** - Builds and deploys to Cloud Run

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

### Google Cloud Authentication
- `WIF_PROVIDER` - Workload Identity Federation provider (format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`)
- `WIF_SERVICE_ACCOUNT` - Service account email for Workload Identity (e.g., `github-actions@PROJECT_ID.iam.gserviceaccount.com`)
- `GCP_PROJECT_ID` - Your Google Cloud project ID

### Service Accounts (for Cloud Run)
- `SA_MAP2CSV` - Service account for map2csv service
- `SA_NORMALIZER` - Service account for normalizer service

### API Keys
- `GOOGLE_MAPS_API_KEY` - Google Maps API key (for normalizer service)

## Setting Up Workload Identity Federation

Workload Identity Federation is the recommended way to authenticate GitHub Actions with Google Cloud (no service account keys needed).

### 1. Create a Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github-actions" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 2. Create a Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_ORG_OR_USER'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

Replace `YOUR_GITHUB_ORG_OR_USER` with your GitHub organization or username.

### 3. Create a Service Account

```bash
gcloud iam service-accounts create github-actions \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Service Account"
```

### 4. Grant Permissions

```bash
# Grant necessary roles to the service account
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 5. Allow GitHub Actions to Impersonate the Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/YOUR_GITHUB_ORG/poster-map"
```

Replace `PROJECT_NUMBER`, `YOUR_GITHUB_ORG` with your actual values.

### 6. Get the Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --format="value(name)"
```

Use this value for the `WIF_PROVIDER` secret.

## Alternative: Using Service Account Keys (Not Recommended)

If you prefer to use service account keys instead of Workload Identity Federation:

1. Create a service account key:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com
   ```

2. Add the key content as `GCP_SA_KEY` secret in GitHub

3. Modify the workflow to use `google-github-actions/auth@v2` with `credentials_json: ${{ secrets.GCP_SA_KEY }}`

## Testing the Pipeline

1. Create a pull request to test the test jobs
2. Merge to main/master to trigger the deployment jobs
3. Check the Actions tab in GitHub to monitor the workflow progress

## Troubleshooting

- **Authentication errors**: Verify your Workload Identity Federation setup and service account permissions
- **Docker build errors**: Check that all required environment variables are set
- **Deployment errors**: Verify that Artifact Registry repositories exist for each service
- **Test failures**: Run tests locally with `cd normalizer && python test_integration.py`

## Local Testing

You can test the deployment commands locally:

```bash
# Test normalizer deployment
cd normalizer
make deploy

# Test map2csv deployment
cd map2csv
make deploy
```
