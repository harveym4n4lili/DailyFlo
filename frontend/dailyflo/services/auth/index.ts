/**
 * Authentication Services Index
 * 
 * This file exports all authentication-related services for managing
 * user authentication, token handling, and social login integration.
 * 
 * Think of this as the "security directory" - it organizes all the
 * services that handle user security and authentication.
 */

// Main Authentication Service - Core auth operations
export { default as authService } from './AuthService';

// Token Management - JWT token handling and refresh
export { TokenManager } from './TokenManager';
