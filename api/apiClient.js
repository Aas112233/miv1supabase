// src/api/apiClient.js
import API_CONFIG from '../config/apiConfig';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    let url = `${this.baseURL}?path=${endpoint}`;
    
    // Add token as URL parameter if it exists
    if (this.token) {
      url += `&token=${encodeURIComponent(this.token)}`;
    }
    
    // Add data as URL parameters for POST/PUT to avoid CORS
    if (options.data) {
      Object.keys(options.data).forEach(key => {
        url += `&${key}=${encodeURIComponent(options.data[key])}`;
      });
    }
    
    const config = {
      method: options.method || 'GET',
    };
    
    // Don't set headers or body to avoid CORS preflight

    try {
      // Add a small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      // Handle CORS errors specifically
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'GET', data, ...options });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'GET', data, ...options });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', data: { delete: 'true' }, ...options });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;