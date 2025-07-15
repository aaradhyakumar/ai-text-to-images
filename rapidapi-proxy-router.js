// RapidAPI Proxy Router - Single Entry Point for All 20 Workers
// This creates ONE URL for RapidAPI while distributing load across 20 workers

export default {
  async fetch(request, env, ctx) {
    // Your 20 worker endpoints
    const WORKER_ENDPOINTS = [
      'https://ai-image-api-1.yourname.workers.dev',
      'https://ai-image-api-2.yourname.workers.dev',
      'https://ai-image-api-3.yourname.workers.dev',
      'https://ai-image-api-4.yourname.workers.dev',
      'https://ai-image-api-5.yourname.workers.dev',
      'https://ai-image-api-6.yourname.workers.dev',
      'https://ai-image-api-7.yourname.workers.dev',
      'https://ai-image-api-8.yourname.workers.dev',
      'https://ai-image-api-9.yourname.workers.dev',
      'https://ai-image-api-10.yourname.workers.dev',
      'https://ai-image-api-11.yourname.workers.dev',
      'https://ai-image-api-12.yourname.workers.dev',
      'https://ai-image-api-13.yourname.workers.dev',
      'https://ai-image-api-14.yourname.workers.dev',
      'https://ai-image-api-15.yourname.workers.dev',
      'https://ai-image-api-16.yourname.workers.dev',
      'https://ai-image-api-17.yourname.workers.dev',
      'https://ai-image-api-18.yourname.workers.dev',
      'https://ai-image-api-19.yourname.workers.dev',
      'https://ai-image-api-20.yourname.workers.dev'
    ];

    // CORS headers for RapidAPI
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host, X-RapidAPI-User',
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
    const searchParams = url.search;

    try {
      // Special proxy health check endpoint
      if (path === '/proxy/health') {
        const healthyWorkers = await this.checkHealthyWorkers(WORKER_ENDPOINTS);
        return new Response(JSON.stringify({
          success: true,
          proxy: "healthy",
          totalWorkers: WORKER_ENDPOINTS.length,
          healthyWorkers: healthyWorkers.length,
          unhealthyWorkers: WORKER_ENDPOINTS.length - healthyWorkers.length,
          capacity: `${healthyWorkers.length * 100000} requests/day`,
          distribution: "round-robin with health checks",
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Select healthy worker endpoint
      const selectedWorker = await this.selectHealthyWorker(request, WORKER_ENDPOINTS);
      
      if (!selectedWorker) {
        return new Response(JSON.stringify({
          success: false,
          error: "Service temporarily unavailable",
          message: "All workers are currently busy. Please try again in a moment.",
          retryAfter: 30
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Construct target URL
      const targetUrl = `${selectedWorker}${path}${searchParams}`;
      
      // Create proxy request with all original headers
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      // Forward request to selected worker
      const response = await fetch(proxyRequest);
      
      // Clone response to modify headers
      const responseBody = await response.text();
      
      // Create modified response with proxy headers
      const modifiedResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders,
          'X-Proxy-Router': 'rapidapi-proxy',
          'X-Selected-Worker': selectedWorker,
          'X-Total-Workers': WORKER_ENDPOINTS.length.toString(),
          'X-Load-Distribution': 'round-robin'
        }
      });

      return modifiedResponse;

    } catch (error) {
      console.error('Proxy router error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Proxy error",
        message: "Unable to process request. Please try again.",
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // Select healthy worker using intelligent routing
  async selectHealthyWorker(request, endpoints) {
    // Use request hash for consistent routing (same user gets same worker when possible)
    const requestHash = await this.hashRequest(request);
    
    // Try 3 different workers based on hash
    for (let attempt = 0; attempt < 3; attempt++) {
      const index = (requestHash + attempt) % endpoints.length;
      const endpoint = endpoints[index];
      
      if (await this.isWorkerHealthy(endpoint)) {
        return endpoint;
      }
    }
    
    // Fallback: check all workers if hash-based selection fails
    for (const endpoint of endpoints) {
      if (await this.isWorkerHealthy(endpoint)) {
        return endpoint;
      }
    }
    
    return null;
  },

  // Create hash from request for consistent routing
  async hashRequest(request) {
    const url = new URL(request.url);
    const hashInput = url.pathname + (url.search || '');
    
    // Add user IP or identifier for better distribution
    const userIdentifier = request.headers.get('X-RapidAPI-User') || 
                          request.headers.get('X-Forwarded-For') || 
                          request.headers.get('CF-Connecting-IP') || 
                          'anonymous';
    
    const fullHashInput = hashInput + userIdentifier;
    const encoder = new TextEncoder();
    const data = encoder.encode(fullHashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to number for array indexing
    return hashArray[0] + (hashArray[1] << 8);
  },

  // Check if worker is healthy
  async isWorkerHealthy(endpoint) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.success === true && data.status === 'healthy';
      
    } catch (error) {
      // Worker is unhealthy if timeout or error
      return false;
    }
  },

  // Check all workers health status
  async checkHealthyWorkers(endpoints) {
    const healthPromises = endpoints.map(async (endpoint) => {
      const healthy = await this.isWorkerHealthy(endpoint);
      return healthy ? endpoint : null;
    });
    
    const results = await Promise.all(healthPromises);
    return results.filter(endpoint => endpoint !== null);
  }
};