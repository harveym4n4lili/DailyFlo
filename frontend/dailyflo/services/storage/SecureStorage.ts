/**
 * Secure Storage Service
 * 
 * This service provides secure storage for sensitive data like tokens, passwords,
 * and other confidential information using the device's keychain/keystore.
 * Think of it as a "secure vault" for your app - it keeps sensitive data safe
 * using the device's built-in security features.
 * 
 * Key concepts:
 * - Keychain: A secure storage system built into mobile devices (like a safe)
 * - Biometric Authentication: Using fingerprint or face recognition for security
 * - Encryption: Converting data into a secret code that only your app can read
 * - Secure Storage: Keeping sensitive data safe from other apps and users
 */

import * as Keychain from 'react-native-keychain';

/**
 * Secure Storage service class
 * This class handles all secure storage operations
 */
class SecureStorageService {
  private serviceName: string;

  constructor() {
    // This is like the name of your safe - it identifies your app's storage
    this.serviceName = 'DailyFlo';
  }

  /**
   * Store sensitive data securely
   * This saves data in the device's secure keychain
   * 
   * @param key - The name/key for the data
   * @param value - The sensitive data to store
   * @returns Promise that resolves when data is stored
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      console.log(`Storing secure data for key: ${key}`);
      
      // Store data in the keychain with a unique identifier
      await Keychain.setInternetCredentials(
        `${this.serviceName}_${key}`, // Unique identifier for this data
        key,                          // Username (we use the key as username)
        value,                        // The actual data to store
        {}                            // Options object
      );
      
      console.log(`Secure data stored successfully for key: ${key}`);
    } catch (error) {
      console.error(`SecureStorage setItem failed for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Retrieve sensitive data securely
   * This gets data from the device's secure keychain
   * 
   * @param key - The name/key of the data to retrieve
   * @returns Promise with the data or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    try {
      console.log(`Retrieving secure data for key: ${key}`);
      
      // Get data from the keychain
      const credentials = await Keychain.getInternetCredentials(
        `${this.serviceName}_${key}`,
        {}
      );
      
      if (credentials && credentials.password) {
        console.log(`Secure data retrieved successfully for key: ${key}`);
        return credentials.password;
      }
      
      console.log(`No secure data found for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`SecureStorage getItem failed for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   * This deletes data from the device's secure keychain
   * 
   * @param key - The name/key of the data to remove
   * @returns Promise that resolves when data is removed
   */
  async removeItem(key: string): Promise<void> {
    try {
      console.log(`Removing secure data for key: ${key}`);
      
      // Remove data from the keychain
      await (Keychain.resetInternetCredentials as any)(`${this.serviceName}_${key}`);
      
      console.log(`Secure data removed successfully for key: ${key}`);
    } catch (error) {
      console.error(`SecureStorage removeItem failed for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in secure storage
   * This checks if data is stored for a given key
   * 
   * @param key - The name/key to check
   * @returns Promise with boolean indicating if key exists
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        `${this.serviceName}_${key}`
      );
      return !!(credentials && credentials.password);
    } catch (error) {
      console.error(`SecureStorage hasKey failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Store access token securely
   * This saves the user's access token (used for API calls)
   * 
   * @param token - The access token to store
   * @returns Promise that resolves when token is stored
   */
  async storeAccessToken(token: string): Promise<void> {
    try {
      console.log('Storing access token securely...');
      await this.setItem('accessToken', token);
      console.log('Access token stored successfully');
    } catch (error) {
      console.error('Store access token failed:', error);
      throw error;
    }
  }

  /**
   * Get access token securely
   * This retrieves the user's access token
   * 
   * @returns Promise with access token or null
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await this.getItem('accessToken');
    } catch (error) {
      console.error('Get access token failed:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   * This saves the user's refresh token (used to get new access tokens)
   * 
   * @param token - The refresh token to store
   * @returns Promise that resolves when token is stored
   */
  async storeRefreshToken(token: string): Promise<void> {
    try {
      console.log('Storing refresh token securely...');
      await this.setItem('refreshToken', token);
      console.log('Refresh token stored successfully');
    } catch (error) {
      console.error('Store refresh token failed:', error);
      throw error;
    }
  }

  /**
   * Get refresh token securely
   * This retrieves the user's refresh token
   * 
   * @returns Promise with refresh token or null
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await this.getItem('refreshToken');
    } catch (error) {
      console.error('Get refresh token failed:', error);
      return null;
    }
  }

  /**
   * Store user data securely
   * This saves the user's profile information
   * 
   * @param userData - The user data to store
   * @returns Promise that resolves when data is stored
   */
  async storeUserData(userData: any): Promise<void> {
    try {
      console.log('Storing user data securely...');
      
      // Convert the user data to a string for storage
      const serializedData = JSON.stringify(userData);
      await this.setItem('user', serializedData);
      
      console.log('User data stored successfully');
    } catch (error) {
      console.error('Store user data failed:', error);
      throw error;
    }
  }

  /**
   * Get user data securely
   * This retrieves the user's profile information
   * 
   * @returns Promise with user data or null
   */
  async getUserData(): Promise<any> {
    try {
      const data = await this.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get user data failed:', error);
      return null;
    }
  }

  /**
   * Store biometric credentials
   * This saves login credentials that can be accessed with biometrics (fingerprint/face)
   * 
   * @param username - The username/email
   * @param password - The password
   * @returns Promise that resolves when credentials are stored
   */
  async storeBiometricCredentials(username: string, password: string): Promise<void> {
    try {
      console.log('Storing biometric credentials...');
      
      await Keychain.setInternetCredentials(
        `${this.serviceName}_biometric`,
        username,
        password,
        {
          // Require biometric authentication to access these credentials
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        }
      );
      
      console.log('Biometric credentials stored successfully');
    } catch (error) {
      console.error('Store biometric credentials failed:', error);
      throw error;
    }
  }

  /**
   * Get biometric credentials
   * This retrieves login credentials using biometric authentication
   * 
   * @returns Promise with credentials or null
   */
  async getBiometricCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      console.log('Retrieving biometric credentials...');
      
      const credentials = await Keychain.getInternetCredentials(
        `${this.serviceName}_biometric`
      );
      
      if (credentials && credentials.username && credentials.password) {
        console.log('Biometric credentials retrieved successfully');
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      
      console.log('No biometric credentials found');
      return null;
    } catch (error) {
      console.error('Get biometric credentials failed:', error);
      return null;
    }
  }

  /**
   * Check if biometric authentication is available
   * This determines if the device supports biometric authentication
   * 
   * @returns Promise with boolean indicating if biometrics are available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      console.error('Check biometric availability failed:', error);
      return false;
    }
  }

  /**
   * Get supported biometric type
   * This tells you what type of biometric authentication is available
   * 
   * @returns Promise with biometric type or null
   */
  async getSupportedBiometryType(): Promise<string | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error) {
      console.error('Get supported biometry type failed:', error);
      return null;
    }
  }

  /**
   * Clear all secure storage
   * This removes all stored data (used when logging out)
   * 
   * @returns Promise that resolves when all data is cleared
   */
  async clearAll(): Promise<void> {
    try {
      console.log('Clearing all secure storage...');
      
      // List of common keys to remove
      const commonKeys = [
        'accessToken',
        'refreshToken',
        'user',
        'biometric',
        'lastLogin',
        'userPreferences',
      ];
      
      // Remove all the keys
      await Promise.all(
        commonKeys.map(key => this.removeItem(key))
      );
      
      console.log('All secure storage cleared successfully');
    } catch (error) {
      console.error('Clear all secure storage failed:', error);
      throw error;
    }
  }

  /**
   * Store last login time
   * This records when the user last logged in
   * 
   * @returns Promise that resolves when time is stored
   */
  async storeLastLoginTime(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await this.setItem('lastLogin', timestamp);
    } catch (error) {
      console.error('Store last login time failed:', error);
      throw error;
    }
  }

  /**
   * Get last login time
   * This retrieves when the user last logged in
   * 
   * @returns Promise with last login date or null
   */
  async getLastLoginTime(): Promise<Date | null> {
    try {
      const timestamp = await this.getItem('lastLogin');
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Get last login time failed:', error);
      return null;
    }
  }

  /**
   * Check if device is secure
   * This determines if the device has biometrics or passcode protection
   * 
   * @returns Promise with boolean indicating if device is secure
   */
  async isDeviceSecure(): Promise<boolean> {
    try {
      const biometryType = await this.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      console.error('Check device security failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const secureStorageService = new SecureStorageService();
export default secureStorageService;
