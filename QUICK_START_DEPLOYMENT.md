# Quick Start: Deploy to Vercel + AWS Remotion Lambda

## Prerequisites Checklist

- [ ] AWS Account with IAM user credentials
- [ ] Vercel Account
- [ ] Supabase Account (for video storage)
- [ ] AssemblyAI API Key

## Step 1: Deploy Remotion Lambda (One-time setup)

**Run this locally** (not in Vercel):

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=your_aws_access_key
export AWS_SECRET_ACCESS_KEY=your_aws_secret_key
export REMOTION_SITE_NAME=remotion-caption-platform-prod

# Deploy
node deploy.mjs
```

**Save the output** - you'll need the `siteName` for Vercel!

## Step 2: Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository

3. **Add Environment Variables** in Vercel Dashboard:

   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   REMOTION_AWS_REGION=us-east-1
   REMOTION_SITE_NAME=remotion-caption-platform-prod  # From Step 1!
   
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ASSEMBLYAI_API_KEY=your_assemblyai_key
   ```

4. **Deploy!** 🚀

## Step 3: Update Remotion Site (When Needed)

When you change Remotion compositions, redeploy:

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export REMOTION_SITE_NAME=remotion-caption-platform-prod
node deploy.mjs
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Set up Remotion Lambda" error | Add AWS credentials to Vercel env vars |
| "Site not found" | Verify `REMOTION_SITE_NAME` matches deployed site |
| Lambda function not found | Re-run `node deploy.mjs` |

## Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
