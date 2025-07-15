# 🚀 Simple Setup Guide - From ZIP to RapidAPI

## Step 1: Download & Extract
1. Download the ZIP file from this project
2. Extract all files to a folder (e.g., `ai-image-api`)
3. Open terminal/command prompt in that folder

## Step 2: Prepare Your Cloudflare Accounts
You need 20 Cloudflare accounts + 1 for the proxy router (21 total)

### Create Accounts:
1. Go to https://cloudflare.com
2. Sign up for Account 1 (use your main email)
3. Sign up for Account 2 (use email+1@gmail.com)
4. Continue until you have 20 accounts
5. Create Account 21 for the proxy router

### Get API Tokens:
For each account:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Copy the token and save it

## Step 3: Update Configuration Files

### 3.1 Update Worker URLs
Edit `rapidapi-proxy-router.js`:
- Replace `yourname` with your actual Cloudflare username
- Update all 20 worker URLs:
```javascript
const WORKER_ENDPOINTS = [
  'https://ai-image-api-1.YOURUSERNAME.workers.dev',
  'https://ai-image-api-2.YOURUSERNAME.workers.dev',
  // ... update all 20 URLs
];
```

### 3.2 Update Deployment Script
Edit `deployment-scripts/deploy-all-workers.sh`:
- Replace `your-account-id-here` with your actual account IDs
- Replace `your-api-token-here` with your actual API tokens

## Step 4: Deploy to Cloudflare

### 4.1 Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
```

### 4.2 Deploy All 20 Workers
```bash
# Make script executable
chmod +x deployment-scripts/deploy-all-workers.sh

# Deploy all workers
./deployment-scripts/deploy-all-workers.sh
```

### 4.3 Deploy Proxy Router
```bash
# Make script executable
chmod +x deployment-scripts/deploy-proxy-router.sh

# Deploy proxy router
./deployment-scripts/deploy-proxy-router.sh
```

## Step 5: Test Everything
```bash
# Test all workers
node deployment-scripts/test-proxy-router.js

# Test with image generation
node deployment-scripts/test-proxy-router.js --test-generation
```

## Step 6: Connect to RapidAPI

### 6.1 Go to RapidAPI Hub
1. Visit https://rapidapi.com/hub
2. Click "Add New API"
3. Choose "Create API"

### 6.2 Fill Basic Information
- **API Name**: AI Image Generation API
- **Description**: Professional AI image generation with flux models
- **Category**: AI/Machine Learning
- **Base URL**: `https://rapidapi-proxy-router.YOURUSERNAME.workers.dev`

### 6.3 Add Endpoints
Add these endpoints one by one:

**Endpoint 1: Generate Image**
- Method: POST
- Path: `/api/generate`
- Description: Generate AI images from text prompts

**Endpoint 2: Health Check**
- Method: GET
- Path: `/api/health`
- Description: Check API health status

**Endpoint 3: Available Models**
- Method: GET
- Path: `/api/models`
- Description: Get available AI models

**Endpoint 4: Webhook Generate**
- Method: POST
- Path: `/api/webhook/generate`
- Description: Generate images for automation platforms

### 6.4 Test in RapidAPI
1. Click "Test" on each endpoint
2. For POST endpoints, use this test data:
```json
{
  "prompt": "A beautiful sunset over mountains",
  "model": "flux",
  "width": 512,
  "height": 512
}
```

### 6.5 Publish Your API
1. Click "Publish API"
2. Set pricing (can be free tier)
3. Add documentation
4. Submit for review

## Step 7: You're Done! 🎉

Your setup is now complete:
- ✅ 20 Cloudflare workers deployed
- ✅ Proxy router connecting everything
- ✅ Single URL for RapidAPI
- ✅ 60M free requests per month capacity
- ✅ Professional API on RapidAPI marketplace

## 🔄 The Connection Flow

```
RapidAPI User Makes Request
        ↓
Single URL: rapidapi-proxy-router.YOURUSERNAME.workers.dev
        ↓
Proxy Router Selects 1 of 20 Workers
        ↓
Worker Processes Request
        ↓
Returns Image to User
```

## 🆘 If Something Goes Wrong

### Workers Not Deploying?
1. Check your API tokens are correct
2. Make sure account IDs are right
3. Try deploying one worker manually first

### Proxy Router Not Working?
1. Check all 20 worker URLs are correct
2. Test individual workers first
3. Make sure proxy router is deployed

### RapidAPI Test Failing?
1. Test the proxy URL directly in browser
2. Check CORS headers are working
3. Make sure at least one worker is healthy

## 📞 Support

If you get stuck:
1. Check the logs in Cloudflare dashboard
2. Test individual components first
3. Make sure all URLs are updated with your username
4. Verify API tokens have correct permissions

## 💡 Pro Tips

1. **Use the same naming**: Keep worker names consistent (ai-image-api-1, ai-image-api-2, etc.)
2. **Test step by step**: Don't rush, test each step before moving to next
3. **Keep tokens safe**: Don't share your API tokens publicly
4. **Monitor usage**: Check Cloudflare dashboard for request counts
5. **Start small**: Test with 2-3 workers first, then scale to 20

Your 60M free requests per month strategy is now ready to launch! 🚀