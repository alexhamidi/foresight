#!/bin/bash
# Deployment script for the Foresight backend on GKE

set -e  # Exit on error

# Configuration
PROJECT_ID="foresight-backend"  # Change to your GCP project ID
CLUSTER_NAME="foresight-cluster"
REGION="us-central1"
IMAGE_NAME="foresight-api"
VERSION=${1:-v1.0.0}  # Use first argument as version or default to v1.0.0

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process for Foresight Backend ${VERSION}${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "kubernetes" ]; then
    echo -e "${RED}Please run this script from the project root directory.${NC}"
    exit 1
fi

# Ensure we have the correct GCP project set
echo -e "${YELLOW}Setting GCP project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Ensure we have access to the GKE cluster
echo -e "${YELLOW}Getting credentials for GKE cluster...${NC}"
gcloud container clusters get-credentials ${CLUSTER_NAME} --region ${REGION}

# Update the deployment YAML with the new image tag
echo -e "${YELLOW}Updating deployment with new image...${NC}"
sed -i.bak "s|gcr.io/${PROJECT_ID}/${IMAGE_NAME}:.*|gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${VERSION}|g" kubernetes/deployment.yaml
rm kubernetes/deployment.yaml.bak

# Create static IP if it doesn't exist
IP_NAME="foresight-backend-ip"
if ! gcloud compute addresses describe ${IP_NAME} --global &> /dev/null; then
    echo -e "${YELLOW}Creating global static IP...${NC}"
    gcloud compute addresses create ${IP_NAME} --global
fi

# Create SSL policy if it doesn't exist
SSL_POLICY="foresight-ssl-policy"
if ! gcloud compute ssl-policies describe ${SSL_POLICY} &> /dev/null; then
    echo -e "${YELLOW}Creating SSL policy...${NC}"
    gcloud compute ssl-policies create ${SSL_POLICY} \
        --profile MODERN \
        --min-tls-version 1.2
fi

# Apply Kubernetes configurations
echo -e "${YELLOW}Applying Kubernetes configurations...${NC}"
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/pdb.yaml
kubectl apply -f kubernetes/hpa.yaml
kubectl apply -f kubernetes/networkpolicy.yaml

# Apply secrets
if [ -f "kubernetes/secrets.yaml" ]; then
    kubectl apply -f kubernetes/secrets.yaml
else
    echo -e "${RED}Warning: secrets.yaml not found. Make sure to run setup-secrets.sh first.${NC}"
fi

# Apply ingress last (after services are created)
kubectl apply -f kubernetes/ingress.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/foresight-backend

# Show service info
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "Service exposed at:"
echo -e "- Internal: $(kubectl get service foresight-backend-svc -o jsonpath='{.spec.clusterIP}')"
echo -e "- External IP (may take a few minutes to provision): $(gcloud compute addresses describe ${IP_NAME} --global --format='value(address)')"
echo -e "${YELLOW}Note: It may take up to 15 minutes for the SSL certificate to be provisioned.${NC}"

# Show pods
echo -e "\n${YELLOW}Current pods:${NC}"
kubectl get pods -l app=foresight-backend

echo -e "\n${GREEN}Deployment completed successfully!${NC}"
