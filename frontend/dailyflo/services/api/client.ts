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
import AsyncStorage from '@react-native-async-storage/async-storage';
// redux store imports - access auth state and dispatch actions
// store: the main redux store that holds all app state
// logout: action that logs out the user
import { store } from '../../store';
import { logout } from '../../store/slices/auth/authSlice';
// token storage imports - secure storage for authentication tokens
// these functions store and retrieve tokens from Expo SecureStore (encrypted storage)
import {
  getAccessToken,
  getRefreshToken,
  storeAccessToken,
  storeRefreshToken,
  clearAllTokens,
} from '../auth/tokenStorage';

// storage key for tracking onboarding completion status
// this key is used to check if the user has completed the onboarding flow
// when user logs out, we reset this so they see onboarding screens again
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

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
  // Uses environment variable if set, otherwise falls back to your local network ip
  // The ip address (192.168.0.99) allows your phone on the same wifi network to access django
  // Change this to your computer's ip address if it changes
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.99:8000',
  
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
   * 
   * This interceptor automatically adds the authentication token to every request
   * by getting it from secure storage (Expo SecureStore)
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Don't add auth token for login/register/refresh endpoints
      // These endpoints don't require authentication and would fail with auth headers
      const isAuthEndpoint = config.url?.includes('/auth/login/') || 
                             config.url?.includes('/auth/register/') || 
                             config.url?.includes('/auth/refresh/');
      
      if (!isAuthEndpoint) {
        // Get the access token from secure storage
        // SecureStore encrypts tokens and stores them securely on the device
        const token = await getAccessToken();
        
        // If we have a token, add it to the request headers
        // The backend will check this token to verify the user is authenticated
        // The format is "Bearer <token>" which is the standard for JWT tokens
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
      
      // Don't try to refresh tokens for login/register/refresh endpoints
      // These endpoints can return 401 for invalid credentials, not expired tokens
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/login/') || 
                             originalRequest?.url?.includes('/auth/register/') || 
                             originalRequest?.url?.includes('/auth/refresh/');
      
      // Handle 401 Unauthorized - This means "your login has expired"
      // When we get a 401, the access token has likely expired, so we try to refresh it
      // But skip auth endpoints since they handle their own 401 errors
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
        // Mark this request as retried so we don't loop forever
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token by getting a new access token using the refresh token
          // Get the refresh token from secure storage
          const refreshTokenValue = await getRefreshToken();
          
          if (!refreshTokenValue) {
            // No refresh token available, user needs to log in again
            throw new Error('No refresh token available');
          }
          
          // Call the refresh token endpoint directly using axios (not apiClient to avoid interceptors)
          // We need to use the base URL from defaultConfig since we're calling axios directly
          const response = await axios.post(`${defaultConfig.baseURL}/accounts/auth/refresh/`, {
            refresh: refreshTokenValue,
          });
          
          // Extract the new tokens from the response
          // Backend returns tokens in different formats, handle both
          const { access, refresh: newRefreshToken } = response.data;
          
          if (!access) {
            throw new Error('New access token not received');
          }
          
          // Store the new tokens in secure storage
          // This updates the tokens so future requests will use the new access token
          await storeAccessToken(access);
          if (newRefreshToken) {
            // Store new refresh token if provided (some backends rotate refresh tokens)
            await storeRefreshToken(newRefreshToken);
          }
          
          // Update the original request with the new token
          // This allows us to retry the failed request with the new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          
          // Retry the original request with the new token
          return client(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and logout user
          // This means the refresh token is also expired or invalid, user needs to log in again
          await clearAllTokens();
          // Dispatch logout action to clear Redux state
          store.dispatch(logout());
          
          // Reset onboarding status when user is logged out due to token refresh failure
          // This ensures that after logout, the user will see onboarding screens again
          // This is important because a logged-out user should be treated as a new user
          try {
            await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
          } catch (onboardingError) {
            // If resetting onboarding fails, log it but don't fail the logout
            // The logout should still succeed even if onboarding reset fails
            console.error('Error resetting onboarding during token refresh failure:', onboardingError);
          }
          
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
