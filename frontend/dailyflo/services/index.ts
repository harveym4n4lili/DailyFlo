/**
 * Services Index
 * 
 * This file exports all service modules for easy importing.
 * Services handle external API calls, data persistence, and other
 * business logic that doesn't belong in components or Redux slices.
 * 
 * Think of this as the "main directory" for all your services -
 * it makes it easy to import any service from anywhere in your app.
 */

// API Services - Handle HTTP requests to the backend
export * from './api';

// Authentication Services - Handle user auth, tokens, and social login
export * from './auth';

// Storage Services - Handle local data persistence
export * from './storage';

// Sync Services - Handle offline data synchronization
export * from './sync';
