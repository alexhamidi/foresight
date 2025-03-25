#!/bin/bash

# Exit on any error
set -e

# Get the version from the command line or use the current timestamp
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}

echo "🚀 Updating Foresight Backend to version: $VERSION"

# Build the image using Cloud Build
echo "📦 Building image using Cloud Build..."
gcloud builds submit --tag gcr.io/foresight-backend/foresight-api:$VERSION

# Update the deployment with the new image
echo "🔄 Updating Kubernetes deployment..."
kubectl set image deployment/foresight-backend foresight-api=gcr.io/foresight-backend/foresight-api:$VERSION

# Wait for rollout to complete
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/foresight-backend

echo "✅ Update completed successfully!"
echo "🔍 You can check the pods status with: kubectl get pods"
