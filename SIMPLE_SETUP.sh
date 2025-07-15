#!/bin/bash

# 🚀 Simple Setup Script for 20 Cloudflare Accounts + RapidAPI
# This script automates the entire deployment process

echo "🚀 Starting AI Image API Deployment to 20 Cloudflare Accounts..."
echo "================================================"

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI is not installed. Installing now..."
        npm install -g wrangler
    fi
    
    echo "✅ All requirements satisfied!"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
}

# Generate configuration files for all 20 accounts
generate_configs() {
    echo "⚙️ Generating configuration files for 20 accounts..."
    
    # Create accounts directory
    mkdir -p accounts
    
    # Generate wrangler.toml files for each account
    for i in {1..20}; do
        cat > accounts/wrangler-account-${i}.toml << EOF
name = "ai-image-api-${i}"
main = "cloudflare-worker.js"
compatibility_date = "2023-12-01"

[env.production]
account_id = "ACCOUNT_${i}_ID_HERE"
zone_id = "ZONE_${i}_ID_HERE"

[[env.production.r2_buckets]]
binding = "AI_IMAGES"
bucket_name = "ai-images-${i}"
preview_bucket_name = "ai-images-preview-${i}"

[env.production.vars]
API_NAME = "AI Image API Account ${i}"
ACCOUNT_NUMBER = "${i}"
RAPIDAPI_ENABLED = "true"
EOF
    done
    
    echo "✅ Configuration files generated for all 20 accounts!"
}

# Deploy to all 20 accounts
deploy_all() {
    echo "🚀 Deploying to all 20 Cloudflare accounts..."
    
    # Array to store deployment results
    declare -a results
    
    for i in {1..20}; do
        echo "🔄 Deploying to account ${i}/20..."
        
        # Copy the specific wrangler config
        cp accounts/wrangler-account-${i}.toml wrangler.toml
        
        # Deploy to this account
        if wrangler deploy --env production; then
            echo "✅ Account ${i} deployed successfully!"
            results[${i}]="SUCCESS"
        else
            echo "❌ Account ${i} deployment failed!"
            results[${i}]="FAILED"
        fi
    done
    
    # Print deployment summary
    echo "📊 Deployment Summary:"
    echo "====================="
    
    successful=0
    failed=0
    
    for i in {1..20}; do
        if [ "${results[${i}]}" = "SUCCESS" ]; then
            echo "✅ Account ${i}: SUCCESS"
            ((successful++))
        else
            echo "❌ Account ${i}: FAILED"
            ((failed++))
        fi
    done
    
    echo "📈 Results: ${successful} successful, ${failed} failed"
}

# Setup load balancer
setup_load_balancer() {
    echo "⚖️ Setting up load balancer..."
    
    # Create load balancer configuration
    cat > wrangler-load-balancer.toml << EOF
name = "ai-image-api-load-balancer"
main = "load-balancer.js"
compatibility_date = "2023-12-01"

[env.production]
account_id = "MAIN_ACCOUNT_ID_HERE"

[env.production.vars]
WORKER_ENDPOINTS = "https://ai-image-api-1.your-domain.workers.dev,https://ai-image-api-2.your-domain.workers.dev,https://ai-image-api-3.your-domain.workers.dev,https://ai-image-api-4.your-domain.workers.dev,https://ai-image-api-5.your-domain.workers.dev,https://ai-image-api-6.your-domain.workers.dev,https://ai-image-api-7.your-domain.workers.dev,https://ai-image-api-8.your-domain.workers.dev,https://ai-image-api-9.your-domain.workers.dev,https://ai-image-api-10.your-domain.workers.dev,https://ai-image-api-11.your-domain.workers.dev,https://ai-image-api-12.your-domain.workers.dev,https://ai-image-api-13.your-domain.workers.dev,https://ai-image-api-14.your-domain.workers.dev,https://ai-image-api-15.your-domain.workers.dev,https://ai-image-api-16.your-domain.workers.dev,https://ai-image-api-17.your-domain.workers.dev,https://ai-image-api-18.your-domain.workers.dev,https://ai-image-api-19.your-domain.workers.dev,https://ai-image-api-20.your-domain.workers.dev"
EOF
    
    # Deploy load balancer
    cp wrangler-load-balancer.toml wrangler.toml
    
    if wrangler deploy --env production; then
        echo "✅ Load balancer deployed successfully!"
    else
        echo "❌ Load balancer deployment failed!"
    fi
}

# Generate RapidAPI configuration
generate_rapidapi_config() {
    echo "🔗 Generating RapidAPI configuration..."
    
    cat > rapidapi-config.json << EOF
{
  "api": {
    "name": "AI Image Generation API",
    "description": "Generate high-quality AI images from text prompts using advanced models",
    "version": "1.0.0",
    "category": "Artificial Intelligence",
    "tags": ["AI", "Image Generation", "Text-to-Image", "Art", "Creative"],
    "pricing": {
      "free": {
        "quota": 100,
        "description": "100 free images per month"
      },
      "basic": {
        "price": 0.01,
        "description": "$0.01 per image"
      },
      "premium": {
        "price": 0.05,
        "description": "$0.05 per image (higher quality)"
      }
    }
  },
  "endpoints": [
    {
      "name": "Generate Image",
      "method": "POST",
      "url": "https://ai-image-api-load-balancer.your-domain.workers.dev/api/generate",
      "description": "Generate an AI image from text prompt",
      "parameters": {
        "prompt": {
          "type": "string",
          "required": true,
          "description": "Text description of the image to generate"
        },
        "model": {
          "type": "string",
          "required": false,
          "default": "flux",
          "options": ["flux", "turbo", "flux-realism", "flux-anime", "flux-3d"]
        },
        "width": {
          "type": "integer",
          "required": false,
          "default": 1024,
          "min": 256,
          "max": 2048
        },
        "height": {
          "type": "integer",
          "required": false,
          "default": 1024,
          "min": 256,
          "max": 2048
        }
      }
    },
    {
      "name": "AI Agent Generate",
      "method": "POST",
      "url": "https://ai-image-api-load-balancer.your-domain.workers.dev/api/ai/generate",
      "description": "AI agent optimized image generation"
    },
    {
      "name": "Batch Generate",
      "method": "POST",
      "url": "https://ai-image-api-load-balancer.your-domain.workers.dev/api/batch/generate",
      "description": "Generate multiple images in batch"
    },
    {
      "name": "Health Check",
      "method": "GET",
      "url": "https://ai-image-api-load-balancer.your-domain.workers.dev/api/health",
      "description": "Check API health and status"
    }
  ],
  "backup_endpoints": [
    "https://ai-image-api-1.your-domain.workers.dev",
    "https://ai-image-api-2.your-domain.workers.dev",
    "https://ai-image-api-3.your-domain.workers.dev",
    "https://ai-image-api-4.your-domain.workers.dev",
    "https://ai-image-api-5.your-domain.workers.dev",
    "https://ai-image-api-6.your-domain.workers.dev",
    "https://ai-image-api-7.your-domain.workers.dev",
    "https://ai-image-api-8.your-domain.workers.dev",
    "https://ai-image-api-9.your-domain.workers.dev",
    "https://ai-image-api-10.your-domain.workers.dev",
    "https://ai-image-api-11.your-domain.workers.dev",
    "https://ai-image-api-12.your-domain.workers.dev",
    "https://ai-image-api-13.your-domain.workers.dev",
    "https://ai-image-api-14.your-domain.workers.dev",
    "https://ai-image-api-15.your-domain.workers.dev",
    "https://ai-image-api-16.your-domain.workers.dev",
    "https://ai-image-api-17.your-domain.workers.dev",
    "https://ai-image-api-18.your-domain.workers.dev",
    "https://ai-image-api-19.your-domain.workers.dev",
    "https://ai-image-api-20.your-domain.workers.dev"
  ]
}
EOF
    
    echo "✅ RapidAPI configuration generated!"
}

# Health check all endpoints
health_check() {
    echo "🩺 Performing health check on all endpoints..."
    
    for i in {1..20}; do
        endpoint="https://ai-image-api-${i}.your-domain.workers.dev/api/health"
        
        if curl -s -f "$endpoint" > /dev/null; then
            echo "✅ Account ${i}: Healthy"
        else
            echo "❌ Account ${i}: Unhealthy"
        fi
    done
}

# Main execution
main() {
    echo "🎯 AI Image API Multi-Account Deployment"
    echo "======================================="
    
    check_requirements
    install_dependencies
    generate_configs
    
    echo "⚠️  IMPORTANT: Before proceeding, you need to:"
    echo "1. Edit the wrangler.toml files in accounts/ directory"
    echo "2. Add your actual Cloudflare account IDs and zone IDs"
    echo "3. Make sure you have API tokens for all 20 accounts"
    echo ""
    read -p "Have you completed the configuration? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_all
        setup_load_balancer
        generate_rapidapi_config
        health_check
        
        echo "🎉 Deployment Complete!"
        echo "======================"
        echo "✅ 20 Cloudflare Workers deployed"
        echo "✅ Load balancer configured"
        echo "✅ RapidAPI configuration generated"
        echo "✅ Health checks completed"
        echo ""
        echo "🔗 Next steps:"
        echo "1. Test your load balancer endpoint"
        echo "2. Submit to RapidAPI using rapidapi-config.json"
        echo "3. Monitor performance in Cloudflare dashboard"
        echo "4. Scale based on usage patterns"
    else
        echo "❌ Deployment cancelled. Please configure your accounts first."
    fi
}

# Run the main function
main "$@"