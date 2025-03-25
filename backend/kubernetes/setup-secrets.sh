#!/bin/bash
# Setup script for creating Kubernetes secrets from .env file

# Ensure we're in the project directory
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

# Create a temporary file for the secrets
TEMP_SECRETS=$(mktemp)

# Convert .env file to kubernetes secrets format
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
    continue
  fi

  # Extract key and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)

  # Store in Secret Manager
  echo "Creating secret for $key in Secret Manager..."
  echo -n "$value" | gcloud secrets create "foresight-$key" --data-file=- --replication-policy="automatic"

  # Add to our kubernetes secret file
  echo "  $key: $(echo -n "$value" | base64)" >> "$TEMP_SECRETS"
done < .env

# Create the Kubernetes secret yaml
cat > kubernetes/secrets.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: foresight-secrets
type: Opaque
data:
$(cat "$TEMP_SECRETS")
EOF

# Cleanup
rm "$TEMP_SECRETS"

echo "Created kubernetes/secrets.yaml with your environment variables"
echo "⚠️ WARNING: Never commit secrets.yaml to version control! ⚠️"
echo "Consider adding it to .gitignore"

# Add to .gitignore if not already there
if ! grep -q "kubernetes/secrets.yaml" .gitignore; then
  echo "kubernetes/secrets.yaml" >> .gitignore
  echo "Added kubernetes/secrets.yaml to .gitignore"
fi

echo "Done!"
