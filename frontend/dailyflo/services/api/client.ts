/**
 * HTTP Client Configuration
 * 
 * This file sets up the base HTTP client for making API requests to the Django backend.
 * Think of it as the "postal service" for your app - it handles sending and receiving
 * data between your app and the server.
 * 
 * Key concepts:
 * - Axios: A library that makes HTTP requests (like sending letters to a server)
 * - Interceptors: Functions that run before/after requests (like adding stamps to letters)
 * - Base URL: The main address of your server (like a post office address)
 * - Headers: Extra information sent with each request (like return address)
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Configuration for the API client
 * This tells the client where to send requests and how to behave
 */
interface ApiClientConfig {
  baseURL: string;        // The main URL of your Django server
  timeout: number;        // How long to wait before giving up (in milliseconds)
  headers: Record<string, string>; // Extra information to send with every request
}

/**
 * Default configuration for the API client
 * This is like setting up your default postal service settings
 */
const defaultConfig: ApiClientConfig = {
  // The URL where your Django server is running
  // In development, this is usually localhost:8000
  // In production, this would be your actual server URL
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
  
  // Wait 10 seconds before timing out
  timeout: 10000,
  
  // Headers are like labels on your mail - they tell the server what kind of data you're sending
  headers: {
    'Content-Type': 'application/json', // We're sending JSON data
    'Accept': 'application/json',       // We want JSON data back
  },
};

/**
 * Create and configure the HTTP client
 * This is like setting up your postal service with all the rules and procedures
 */
const createApiClient = (): AxiosInstance => {
  // Create a new axios instance with our default settings
  const client = axios.create(defaultConfig);

  /**
   * REQUEST INTERCEPTOR - Runs BEFORE each request is sent
   * This is like adding a stamp and return address to every letter before sending it
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get the user's authentication token (like getting their ID card)
      const token = getStoredToken();
      
      // If we have a token, add it to the request headers
      // This tells the server "I'm a logged-in user"
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add a timestamp for debugging (like adding a postmark)
      (config as any).metadata = { startTime: new Date() };
      
      return config;
    },
    (error: AxiosError) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  /**
   * RESPONSE INTERCEPTOR - Runs AFTER each response is received
   * This is like checking if your letter was delivered successfully
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful requests (like confirming mail delivery)
      const duration = new Date().getTime() - (response.config as any).metadata?.startTime?.getTime();
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
      
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      // Handle 401 Unauthorized - This means "your login has expired"
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token (like renewing your ID card)
          const newToken = await refreshToken();
          if (newToken) {
            // Retry the original request with the new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, redirect to login (like going to get a new ID card)
          handleAuthError();
          return Promise.reject(refreshError);
        }
      }
      
      // Handle other errors
      handleApiError(error);
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Get stored access token
 * This retrieves the user's login token from secure storage
 * TODO: Replace with actual token storage implementation
 */
const getStoredToken = (): string | null => {
  // This will be replaced with actual storage implementation
  // For now, we'll use localStorage (which works in web environments)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Refresh access token
 * When your login token expires, this gets a new one
 * TODO: Replace with actual token refresh implementation
 */
const refreshToken = async (): Promise<string | null> => {
  try {
    // Get the refresh token (like having a backup ID)
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Make a request to get a new access token
    const response = await axios.post(`${defaultConfig.baseURL}/auth/refresh/`, {
      refresh: refreshToken,
    });
    
    const { access } = response.data;
    localStorage.setItem('accessToken', access);
    
    return access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * Handle authentication errors
 * When login fails, this cleans up and redirects to login
 */
const handleAuthError = (): void => {
  // Clear stored tokens (like throwing away expired ID cards)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  
  // TODO: Dispatch logout action to Redux store
  // dispatch(logout());
  
  // TODO: Navigate to login screen
  // router.replace('/login');
};

/**
 * Handle API errors
 * This processes different types of errors and logs them appropriately
 */
const handleApiError = (error: AxiosError): void => {
  const { response, request, message } = error;
  
  if (response) {
    // Server responded with error status (like getting a "return to sender" notice)
    const { status, data } = response;
    console.error(`API Error ${status}:`, data);
    
    // Handle specific error cases
    switch (status) {
      case 400:
        console.error('Bad Request: The data you sent was invalid');
        break;
      case 403:
        console.error('Forbidden: You don\'t have permission to do this');
        break;
      case 404:
        console.error('Not Found: The resource you\'re looking for doesn\'t exist');
        break;
      case 500:
        console.error('Internal Server Error: Something went wrong on the server');
        break;
      default:
        console.error('API Error:', data);
    }
  } else if (request) {
    // Request was made but no response received (like mail getting lost)
    console.error('Network Error: No response from server');
  } else {
    // Something else happened (like not having enough postage)
    console.error('Request Error:', message);
  }
};

/**
 * Create and export the configured API client
 * This is the main object that other parts of your app will use to make API calls
 */
const apiClient = createApiClient();

export default apiClient;
