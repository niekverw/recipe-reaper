# Google Cloud Vision API Setup

This application uses Google Cloud Vision API to extract text from images for recipe import functionality.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud Project with the Vision API enabled.
2. **Authentication**: Choose one of the two authentication methods below.

## Setup Instructions

### Option 1: Using Application Default Credentials (ADC) - Requires Google Cloud CLI

**✅ Recommended for development and local testing**

This method requires the Google Cloud CLI (`google-cloud-sdk`).

1. **Install Google Cloud CLI**:
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth application-default login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

**Pros**: Easier setup, no key files to manage
**Cons**: Requires CLI installation

### Option 2: Using Service Account Key - No CLI Required

**✅ Better for production or if you don't want to install CLI**

This method uses a JSON key file and doesn't require the Google Cloud CLI.

1. **Create a Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to IAM & Admin > Service Accounts
   - Create a new service account
   - Grant it the "Cloud Vision API User" role

2. **Download the key file**:
   - Click on the service account
   - Go to Keys tab
   - Add Key > Create new key > JSON
   - Save the JSON file securely

3. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

   Or add to your `.env` file:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   ```

**Pros**: No CLI needed, works in any environment
**Cons**: Key file management required

## Enable the Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Library
3. Search for "Cloud Vision API"
4. Click on it and press "Enable"

## Environment Variables

Add these to your backend `.env` file:

### For Option 1 (ADC):
```env
# No additional environment variables needed
# Just ensure gcloud is authenticated: gcloud auth application-default login
```

### For Option 2 (Service Account Key):
```env
# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

## Testing the Setup

You can test if the Vision API is working by running:

```bash
cd backend
npm run dev
```

Then try uploading an image with text through the frontend application.

## Troubleshooting

### Authentication Issues

1. **"Could not load the default credentials"**:
   - Make sure you've either run `gcloud auth application-default login`
   - Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

2. **"The caller does not have permission"**:
   - Make sure the Vision API is enabled in your project
   - Ensure your service account has the "Cloud Vision API User" role

3. **"Project not found"**:
   - Verify your project ID is correct
   - Make sure you have access to the project

### API Issues

1. **"Vision API is not enabled"**:
   - Go to Google Cloud Console > APIs & Services > Library
   - Search for and enable the "Cloud Vision API"

2. **Rate limiting**:
   - The Vision API has usage quotas and limits
   - Check your quotas in the Google Cloud Console

## Costs

The Google Cloud Vision API charges based on usage:
- Text Detection: $1.50 per 1,000 images (first 1,000 images per month are free)
- Check current pricing: https://cloud.google.com/vision/pricing

## Security

- Never commit service account keys to version control
- Use environment variables or secure credential management
- Regularly rotate service account keys
- Follow the principle of least privilege when assigning roles