/**
 * API Configuration
 * Handles backend URL for both localhost and deployed environments
 */

// Detect if we're in a dev container or local environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  console.log(`[API Config] Current location: ${protocol}//${hostname}:${port}`);
  
  // If on localhost/127.0.0.1, use port 3002 for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const backendUrl = 'http://localhost:3002';
    console.log('[API Config] Using localhost backend:', backendUrl);
    return backendUrl;
  }
  
  // If running on a remote host (codespace), construct the backend URL
  // Use HTTPS for codespace domains (.app.github.dev)
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // For codespace domains, use HTTP (GitHub Codespaces forwards ports)
    const backendUrl = `http://${hostname}:3002`;
    console.log('[API Config] Using remote backend (HTTP):', backendUrl);
    return backendUrl;
  }
  
  // Fallback
  return 'http://localhost:3002';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    // Log response for debugging
    console.log(`[API] ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`);

    return response;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw new Error(`Failed to connect to ${url}: ${error.message}`);
  }
};

