// Cloudflare Worker for Individual Account
// This will be deployed to each of your 20 Cloudflare accounts

export default {
  async fetch(request, env, ctx) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check endpoint
      if (path === '/health' || path === '/api/health') {
        return new Response(JSON.stringify({
          success: true,
          status: "healthy",
          model: "flux",
          worker: "cloudflare-worker",
          timestamp: new Date().toISOString(),
          accountId: env.ACCOUNT_ID || "unknown"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Models endpoint
      if (path === '/models' || path === '/api/models') {
        return new Response(JSON.stringify({
          success: true,
          models: [
            { name: "flux", description: "High-quality general purpose model - Default recommended" },
            { name: "turbo", description: "Fast generation model" },
            { name: "flux-realism", description: "Realistic image generation" },
            { name: "flux-anime", description: "Anime style generation" },
            { name: "flux-3d", description: "3D rendering style" }
          ],
          default: "flux"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Main generation endpoint
      if (path === '/generate' || path === '/api/generate') {
        return await handleGenerate(request, env, corsHeaders);
      }

      // Image serving endpoint
      if (path.startsWith('/images/') || path.startsWith('/api/image/')) {
        return await handleImageServing(request, env, corsHeaders);
      }

      // Download endpoint
      if (path.startsWith('/download/') || path.startsWith('/api/download/')) {
        return await handleDownload(request, env, corsHeaders);
      }

      // Webhook endpoint for n8n/Zapier
      if (path === '/webhook/generate' || path === '/api/webhook/generate') {
        return await handleWebhookGenerate(request, env, corsHeaders);
      }

      // AI agent endpoint
      if (path === '/ai/generate' || path === '/api/ai/generate') {
        return await handleAIGenerate(request, env, corsHeaders);
      }

      // API info endpoint
      if (path === '/info' || path === '/api/info') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            name: "AI Image Generation API",
            version: "1.0.0",
            description: "High-quality AI image generation using flux model",
            endpoints: ["/generate", "/images/{id}", "/download/{id}", "/models", "/health"],
            capacity: "100,000 requests/day per worker",
            model: "flux (default)",
            features: ["High-quality generation", "Multiple models", "Global CDN", "Professional API"]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown endpoints
      return new Response(JSON.stringify({
        success: false,
        error: "Endpoint not found",
        availableEndpoints: ["/generate", "/images/{id}", "/download/{id}", "/models", "/health", "/info"]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: "Internal server error"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Validate image generation request
function validateImageGeneration(data) {
  const { prompt, model = 'flux', width = 1024, height = 1024 } = data;
  
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }
  
  if (prompt.length < 3 || prompt.length > 500) {
    throw new Error('Prompt must be between 3 and 500 characters');
  }
  
  if (width < 256 || width > 2048 || height < 256 || height > 2048) {
    throw new Error('Width and height must be between 256 and 2048 pixels');
  }
  
  return { prompt, model, width, height };
}

// Generate UUID for image naming
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Handle image generation
async function handleGenerate(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const validatedData = validateImageGeneration(data);
    
    // Generate image using Pollinations.ai
    const encodedPrompt = encodeURIComponent(validatedData.prompt);
    const selectedModel = validatedData.model || 'flux';
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${validatedData.width}&height=${validatedData.height}&model=${selectedModel}&seed=${Date.now()}&nologo=true&enhance=false&private=false`;
    
    const startTime = Date.now();
    
    // Fetch image from Pollinations.ai
    const imageResponse = await fetch(pollinationUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageId = generateUUID();
    
    // Store image in Cloudflare R2 (if configured) or return direct URL
    const baseUrl = new URL(request.url).origin;
    const imageUrl = `${baseUrl}/images/${imageId}.png`;
    const downloadUrl = `${baseUrl}/download/${imageId}`;
    
    // Store in R2 bucket if available
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(`images/${imageId}.png`, imageBuffer, {
        httpMetadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=86400'
        }
      });
    }
    
    const generationTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: imageId,
        prompt: validatedData.prompt,
        model: validatedData.model,
        width: validatedData.width,
        height: validatedData.height,
        status: "completed",
        imageUrl: imageUrl,
        downloadUrl: downloadUrl,
        generationTime: generationTime,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle image serving
async function handleImageServing(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const imageId = url.pathname.split('/').pop();
    
    if (!imageId) {
      throw new Error('Image ID is required');
    }
    
    // Try to get from R2 bucket
    if (env.R2_BUCKET) {
      const object = await env.R2_BUCKET.get(`images/${imageId}`);
      
      if (object) {
        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    }
    
    // If not in R2, return 404
    return new Response(JSON.stringify({
      success: false,
      error: "Image not found or expired"
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle download
async function handleDownload(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const imageId = url.pathname.split('/').pop();
    
    if (!imageId) {
      throw new Error('Image ID is required');
    }
    
    // Try to get from R2 bucket
    if (env.R2_BUCKET) {
      const object = await env.R2_BUCKET.get(`images/${imageId}.png`);
      
      if (object) {
        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="ai-image-${imageId}.png"`
          }
        });
      }
    }
    
    // If not in R2, return 404
    return new Response(JSON.stringify({
      success: false,
      error: "Image not found or expired"
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle webhook generation (for n8n/Zapier)
async function handleWebhookGenerate(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const validatedData = validateImageGeneration(data);
    
    // Generate image using Pollinations.ai
    const encodedPrompt = encodeURIComponent(validatedData.prompt);
    const selectedModel = validatedData.model || 'flux';
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${validatedData.width}&height=${validatedData.height}&model=${selectedModel}&seed=${Date.now()}&nologo=true&enhance=false&private=false`;
    
    const startTime = Date.now();
    
    // Fetch image from Pollinations.ai
    const imageResponse = await fetch(pollinationUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageId = generateUUID();
    
    // Store image in R2 bucket if available
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(`images/${imageId}.png`, imageBuffer, {
        httpMetadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=86400'
        }
      });
    }
    
    const baseUrl = new URL(request.url).origin;
    const generationTime = Date.now() - startTime;
    
    // Webhook-friendly response format
    return new Response(JSON.stringify({
      success: true,
      id: imageId,
      prompt: validatedData.prompt,
      model: validatedData.model,
      dimensions: `${validatedData.width}x${validatedData.height}`,
      imageUrl: `${baseUrl}/images/${imageId}.png`,
      downloadUrl: `${baseUrl}/download/${imageId}`,
      status: "completed",
      generationTime: generationTime,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle AI agent generation
async function handleAIGenerate(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const validatedData = validateImageGeneration(data);
    
    // Generate image using Pollinations.ai
    const encodedPrompt = encodeURIComponent(validatedData.prompt);
    const selectedModel = validatedData.model || 'flux';
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${validatedData.width}&height=${validatedData.height}&model=${selectedModel}&seed=${Date.now()}&nologo=true&enhance=false&private=false`;
    
    const startTime = Date.now();
    
    // Fetch image from Pollinations.ai
    const imageResponse = await fetch(pollinationUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageId = generateUUID();
    
    // Store image in R2 bucket if available
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(`images/${imageId}.png`, imageBuffer, {
        httpMetadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=86400'
        }
      });
    }
    
    const baseUrl = new URL(request.url).origin;
    const generationTime = Date.now() - startTime;
    
    // AI agent optimized response
    return new Response(JSON.stringify({
      success: true,
      message: "Image generated successfully",
      image: {
        url: `${baseUrl}/images/${imageId}.png`,
        downloadUrl: `${baseUrl}/download/${imageId}`,
        filename: `${imageId}.png`
      },
      metadata: {
        prompt: validatedData.prompt,
        model: validatedData.model,
        dimensions: `${validatedData.width}x${validatedData.height}`,
        generationTime: generationTime,
        status: "completed"
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}