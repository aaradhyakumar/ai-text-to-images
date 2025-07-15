#!/bin/bash

# 🚀 EASY SETUP - AI Image API to RapidAPI
# This script makes the entire setup process super simple

echo "🚀 Welcome to AI Image API Easy Setup!"
echo "This will help you deploy 20 Cloudflare workers and connect to RapidAPI"
echo ""

# Step 1: Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Cloudflare Wrangler..."
    npm install -g wrangler
else
    echo "✅ Wrangler is already installed"
fi

# Step 2: Get user's Cloudflare username
echo ""
echo "🔧 Let's configure your setup..."
read -p "Enter your Cloudflare username (e.g., johnsmith): " CF_USERNAME

if [ -z "$CF_USERNAME" ]; then
    echo "❌ Username is required. Please run the script again."
    exit 1
fi

# Step 3: Update proxy router URLs
echo "📝 Updating proxy router URLs..."
sed -i.bak "s/yourname/$CF_USERNAME/g" rapidapi-proxy-router.js
echo "✅ Proxy router updated with your username"

# Step 4: Update test script URLs
echo "📝 Updating test script URLs..."
sed -i.bak "s/yourname/$CF_USERNAME/g" deployment-scripts/test-proxy-router.js
echo "✅ Test script updated with your username"

# Step 5: Update deployment configuration
echo "📝 Updating deployment configuration..."
sed -i.bak "s/yourname/$CF_USERNAME/g" deployment-scripts/rapid-api-config.json
echo "✅ RapidAPI configuration updated"

# Step 6: Create account setup helper
echo ""
echo "🏗️ Creating account setup helper..."
cat > setup-accounts.md << EOF
# Account Setup Helper

## Your Cloudflare Username: $CF_USERNAME

## Accounts You Need to Create:
1. **Main Account**: your-email@gmail.com
2. **Account 2**: your-email+1@gmail.com  
3. **Account 3**: your-email+2@gmail.com
4. **Account 4**: your-email+3@gmail.com
5. **Account 5**: your-email+4@gmail.com
6. **Account 6**: your-email+5@gmail.com
7. **Account 7**: your-email+6@gmail.com
8. **Account 8**: your-email+7@gmail.com
9. **Account 9**: your-email+8@gmail.com
10. **Account 10**: your-email+9@gmail.com
11. **Account 11**: your-email+10@gmail.com
12. **Account 12**: your-email+11@gmail.com
13. **Account 13**: your-email+12@gmail.com
14. **Account 14**: your-email+13@gmail.com
15. **Account 15**: your-email+14@gmail.com
16. **Account 16**: your-email+15@gmail.com
17. **Account 17**: your-email+16@gmail.com
18. **Account 18**: your-email+17@gmail.com
19. **Account 19**: your-email+18@gmail.com
20. **Account 20**: your-email+19@gmail.com
21. **Proxy Account**: your-email+proxy@gmail.com

## Your Worker URLs Will Be:
- https://ai-image-api-1.$CF_USERNAME.workers.dev
- https://ai-image-api-2.$CF_USERNAME.workers.dev
- ... (up to 20)

## Your RapidAPI URL Will Be:
- https://rapidapi-proxy-router.$CF_USERNAME.workers.dev

## Next Steps:
1. Create all 21 Cloudflare accounts
2. Get API tokens from each account
3. Run: ./deploy-step-by-step.sh
EOF

# Step 7: Create step-by-step deployment script
echo "🛠️ Creating step-by-step deployment script..."
cat > deploy-step-by-step.sh << 'EOF'
#!/bin/bash

echo "🚀 Step-by-Step Deployment Guide"
echo ""

echo "Step 1: Authenticate with Cloudflare"
echo "Run this command for each of your 21 accounts:"
echo "wrangler auth"
echo ""
read -p "Press Enter when you've authenticated with all accounts..."

echo ""
echo "Step 2: Deploy individual workers"
echo "We'll deploy one worker at a time so you can check each one"
echo ""

for i in {1..20}; do
    echo "🔧 Deploying worker $i..."
    echo "You need to use account $i credentials"
    echo ""
    
    # Create individual worker config
    cat > "wrangler-worker-$i.toml" << WORKER_EOF
name = "ai-image-api-$i"
main = "cloudflare-worker-individual.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
WORKER_ID = "$i"
WORKER_NAME = "ai-image-api-$i"
WORKER_TYPE = "image-generation"

[[r2_buckets]]
binding = "IMAGE_STORAGE"
bucket_name = "ai-images-$i"
preview_bucket_name = "ai-images-$i-preview"
WORKER_EOF

    read -p "Press Enter to deploy worker $i (make sure you're using account $i)..."
    
    if wrangler deploy --config "wrangler-worker-$i.toml"; then
        echo "✅ Worker $i deployed successfully!"
    else
        echo "❌ Worker $i deployment failed. Please check and try again."
        exit 1
    fi
    
    echo ""
done

echo "🎯 All 20 workers deployed! Now deploying proxy router..."
echo "Use your proxy account (account 21) for this:"
read -p "Press Enter to deploy proxy router..."

# Deploy proxy router
cat > wrangler-proxy.toml << 'PROXY_EOF'
name = "rapidapi-proxy-router"
main = "rapidapi-proxy-router.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ROUTER_TYPE = "rapidapi-proxy"
TOTAL_WORKERS = "20"
PROXY_EOF

if wrangler deploy --config wrangler-proxy.toml; then
    echo "✅ Proxy router deployed successfully!"
else
    echo "❌ Proxy router deployment failed. Please check and try again."
    exit 1
fi

echo ""
echo "🧪 Testing everything..."
node deployment-scripts/test-proxy-router.js

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Your RapidAPI URL: https://rapidapi-proxy-router.$CF_USERNAME.workers.dev"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://rapidapi.com/hub"
echo "2. Create new API"
echo "3. Use your proxy URL as base URL"
echo "4. Add the endpoints from the guide"
echo "5. Test and publish!"

# Cleanup
rm wrangler-worker-*.toml wrangler-proxy.toml
EOF

chmod +x deploy-step-by-step.sh

echo ""
echo "✅ Easy setup complete!"
echo ""
echo "📋 What's ready for you:"
echo "1. ✅ All URLs updated with your username ($CF_USERNAME)"
echo "2. ✅ Account setup helper created (setup-accounts.md)"
echo "3. ✅ Step-by-step deployment script ready (deploy-step-by-step.sh)"
echo ""
echo "🚀 Next steps:"
echo "1. Read setup-accounts.md for account creation"
echo "2. Create your 21 Cloudflare accounts"
echo "3. Run: ./deploy-step-by-step.sh"
echo ""
echo "Your final RapidAPI URL will be:"
echo "https://rapidapi-proxy-router.$CF_USERNAME.workers.dev"
echo ""
echo "🎯 That's it! This URL connects to all 20 workers automatically!"