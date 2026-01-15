#!/bin/bash

# Deploy Remotion Lambda Function and Site
# Usage: ./scripts/deploy-remotion.sh

set -e

echo "🚀 Deploying Remotion Lambda Function and Site..."

# Check for required environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$REMOTION_AWS_ACCESS_KEY_ID" ]; then
    echo "❌ Error: AWS_ACCESS_KEY_ID or REMOTION_AWS_ACCESS_KEY_ID must be set"
    echo "   Set it with: export AWS_ACCESS_KEY_ID=your_key"
    exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ] && [ -z "$REMOTION_AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS_SECRET_ACCESS_KEY or REMOTION_AWS_SECRET_ACCESS_KEY must be set"
    echo "   Set it with: export AWS_SECRET_ACCESS_KEY=your_secret"
    exit 1
fi

# Set defaults if not provided
export REMOTION_AWS_REGION=${REMOTION_AWS_REGION:-us-east-1}
export REMOTION_SITE_NAME=${REMOTION_SITE_NAME:-remotion-caption-platform}

echo "📋 Configuration:"
echo "   Region: $REMOTION_AWS_REGION"
echo "   Site Name: $REMOTION_SITE_NAME"
echo ""

# Run deployment
node deploy.mjs

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the site name above"
echo "   2. Add REMOTION_SITE_NAME=$REMOTION_SITE_NAME to Vercel environment variables"
echo "   3. Deploy your Next.js app to Vercel"
