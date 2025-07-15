// Load Balancer for 20 Cloudflare Workers
// This distributes requests across all your workers for maximum capacity

export default {
  async fetch(request, env, ctx) {
    // List of all 20 worker endpoints
    const workerEndpoints = [
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

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check for load balancer itself
      if (path === '/load-balancer/health') {
        const healthyWorkers = await checkAllWorkers(workerEndpoints);
        return new Response(JSON.stringify({
          success: true,
          loadBalancer: "healthy",
          totalWorkers: workerEndpoints.length,
          healthyWorkers: healthyWorkers.length,
          unhealthyWorkers: workerEndpoints.length - healthyWorkers.length,
          capacity: `${healthyWorkers.length * 100000} requests/day`,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Load balancer status
      if (path === '/load-balancer/status') {
        const healthyWorkers = await checkAllWorkers(workerEndpoints);
        const workerStatus = await Promise.all(
          workerEndpoints.map(async (endpoint, index) => {
            const isHealthy = await isEndpointHealthy(endpoint);
            return {
              id: index + 1,
              endpoint: endpoint,
              status: isHealthy ? 'healthy' : 'unhealthy',
              lastChecked: new Date().toISOString()
            };
          })
        );

        return new Response(JSON.stringify({
          success: true,
          loadBalancer: {
            status: "operational",
            algorithm: "round-robin with health checks",
            totalCapacity: "60M requests/month",
            currentCapacity: `${healthyWorkers.length * 3000000} requests/month`
          },
          workers: workerStatus,
          summary: {
            total: workerEndpoints.length,
            healthy: healthyWorkers.length,
            unhealthy: workerEndpoints.length - healthyWorkers.length,
            successRate: `${Math.round((healthyWorkers.length / workerEndpoints.length) * 100)}%`
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Route all other requests to healthy workers
      const selectedEndpoint = await selectHealthyEndpoint(request, workerEndpoints);
      
      if (!selectedEndpoint) {
        return new Response(JSON.stringify({
          success: false,
          error: "No healthy workers available",
          message: "All workers are currently unavailable. Please try again later."
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Forward request to selected worker
      const workerUrl = selectedEndpoint + path + url.search;
      const modifiedRequest = new Request(workerUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      const response = await fetch(modifiedRequest);
      
      // Add load balancer headers
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders,
          'X-Load-Balancer': 'ai-image-api-lb',
          'X-Worker-Endpoint': selectedEndpoint
        }
      });

      return modifiedResponse;

    } catch (error) {
      console.error('Load balancer error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: "Load balancer error",
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Select healthy endpoint using round-robin with health checks
async function selectHealthyEndpoint(request, endpoints) {
  // Get request hash for consistent routing
  const requestHash = await hashRequest(request);
  
  // Try up to 3 different workers
  for (let attempt = 0; attempt < 3; attempt++) {
    const index = (requestHash + attempt) % endpoints.length;
    const endpoint = endpoints[index];
    
    if (await isEndpointHealthy(endpoint)) {
      return endpoint;
    }
  }
  
  // If no healthy endpoint found in first 3 attempts, check all
  for (const endpoint of endpoints) {
    if (await isEndpointHealthy(endpoint)) {
      return endpoint;
    }
  }
  
  return null;
}

// Create hash from request for consistent routing
async function hashRequest(request) {
  const url = new URL(request.url);
  const hashInput = url.pathname + (url.search || '');
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return hashArray[0];
}

// Check if endpoint is healthy
async function isEndpointHealthy(endpoint) {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.success === true && data.status === 'healthy';
  } catch (error) {
    console.error(`Health check failed for ${endpoint}:`, error);
    return false;
  }
}

// Check all workers health
async function checkAllWorkers(endpoints) {
  const healthPromises = endpoints.map(endpoint => 
    isEndpointHealthy(endpoint).then(healthy => healthy ? endpoint : null)
  );
  
  const results = await Promise.all(healthPromises);
  return results.filter(endpoint => endpoint !== null);
}