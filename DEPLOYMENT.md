# Deployment Guide: Vercel + AWS Remotion Lambda

This guide will help you deploy your Remotion Caption Platform to Vercel while using AWS Remotion Lambda for video rendering.

## Architecture Overview

- **Frontend (Vercel)**: Next.js application serving the UI
- **AWS Lambda**: Remotion Lambda functions for video rendering
- **AWS S3**: Stores the Remotion site bundle and rendered videos
- **Supabase**: Video file storage (optional, can use S3)

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Vercel Account** (free tier works)
3. **Supabase Account** (for video storage)
4. **AssemblyAI API Key** (for transcription)

## Step 1: Set Up AWS Remotion Lambda

### 1.1 Install AWS CLI (if not already installed)

```bash
# Windows (using Chocolatey)
choco install awscli

# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

### 1.2 Configure AWS Credentials

Create AWS IAM user with these permissions:
- `AWSLambda_FullAccess`
- `IAMFullAccess` (for creating Lambda functions)
- `AmazonS3FullAccess`
- `CloudWatchLogsFullAccess`

Then configure credentials:

```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 1.3 Deploy Remotion Lambda Function and Site

**Important**: This step must be run **locally** or in a CI/CD pipeline, NOT during Vercel build.

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional: Customize Lambda settings
export REMOTION_AWS_REGION=us-east-1
export REMOTION_SITE_NAME=remotion-caption-platform-prod
export REMOTION_LAMBDA_RAM=3009
export REMOTION_LAMBDA_DISK=10240
export REMOTION_LAMBDA_TIMEOUT=240

# Deploy Lambda function and Remotion site
node deploy.mjs
```

This will:
1. Create/update the Lambda function
2. Create/get the S3 bucket
3. Deploy your Remotion site to S3
4. Output the `siteName` (you'll need this for Vercel env vars)

**Note**: Re-run `node deploy.mjs` whenever you:
- Change Remotion compositions
- Update `config.mjs`
- Upgrade Remotion version

## Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2.2 Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 2.3 Configure Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

#### Required AWS Lambda Variables:
```
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
REMOTION_AWS_REGION=us-east-1
REMOTION_SITE_NAME=remotion-caption-platform-prod
```

**Important**: `REMOTION_SITE_NAME` must match the site name from Step 1.3!

#### Optional Lambda Configuration:
```
REMOTION_LAMBDA_RAM=3009
REMOTION_LAMBDA_DISK=10240
REMOTION_LAMBDA_TIMEOUT=240
```

#### Supabase Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### AssemblyAI Variable:
```
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

### 2.4 Deploy

Click **Deploy** and wait for the build to complete.

## Step 3: Verify Deployment

### 3.1 Test the Application

1. Visit your Vercel URL
2. Upload a video
3. Generate captions
4. Try rendering a video

### 3.2 Check Lambda Logs

If rendering fails, check AWS CloudWatch logs:
1. Go to AWS Console → CloudWatch → Log Groups
2. Find your Lambda function logs
3. Look for errors

## Step 4: Update Remotion Site (When Needed)

When you update your Remotion compositions, you need to redeploy the site:

```bash
# Locally or in CI/CD
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export REMOTION_SITE_NAME=remotion-caption-platform-prod

node deploy.mjs
```

## CI/CD Integration (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy-remotion.yml`:

```yaml
name: Deploy Remotion Site

on:
  push:
    branches: [main]
    paths:
      - 'src/remotion/**'
      - 'config.mjs'
      - 'package.json'

jobs:
  deploy-remotion:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy Remotion Site
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          REMOTION_SITE_NAME: ${{ secrets.REMOTION_SITE_NAME }}
          REMOTION_AWS_REGION: ${{ secrets.REMOTION_AWS_REGION }}
        run: node deploy.mjs
```

Add secrets to GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `REMOTION_SITE_NAME`
- `REMOTION_AWS_REGION`

## Troubleshooting

### Issue: "Set up Remotion Lambda" error

**Solution**: Ensure AWS credentials are set in Vercel environment variables.

### Issue: "Site not found" error

**Solution**: 
1. Verify `REMOTION_SITE_NAME` in Vercel matches the deployed site name
2. Re-run `node deploy.mjs` to ensure site is deployed

### Issue: Lambda function not found

**Solution**: 
1. Check AWS region matches in both `config.mjs` and Vercel env vars
2. Verify Lambda function exists in AWS Console
3. Re-run `node deploy.mjs` to create/update function

### Issue: Videos not uploading

**Solution**: 
1. Check Supabase credentials in Vercel
2. Verify Supabase bucket exists and is public
3. Check CORS settings in Supabase

### Issue: Transcription fails

**Solution**: 
1. Verify AssemblyAI API key is set
2. Ensure video URLs are publicly accessible (use Supabase, not local files)

## Cost Considerations

### AWS Lambda Costs
- **Free Tier**: 1M requests/month, 400K GB-seconds compute
- **After Free Tier**: ~$0.20 per 1M requests + compute time
- **Storage**: S3 costs ~$0.023/GB/month

### Vercel Costs
- **Free Tier**: 100GB bandwidth/month, unlimited requests
- **Pro**: $20/month for more bandwidth

### Recommendations
- Monitor AWS CloudWatch for Lambda usage
- Set up billing alerts in AWS
- Use S3 lifecycle policies to delete old rendered videos

## Security Best Practices

1. **Never commit AWS credentials** to git
2. **Use IAM roles** with least privilege
3. **Rotate credentials** regularly
4. **Use Vercel environment variables** for all secrets
5. **Enable AWS CloudTrail** for audit logging
6. **Restrict S3 bucket access** to your Lambda function only

## Next Steps

- Set up monitoring with AWS CloudWatch
- Configure S3 lifecycle policies for old videos
- Set up error tracking (Sentry, etc.)
- Add rate limiting to API routes
- Set up CDN for video delivery
