/**
 * User Entity Type Definition
 * 
 * This file defines the TypeScript interface for User objects.
 * It matches the backend Django CustomUser model structure to ensure
 * type safety between frontend and backend.
 */

// Define the possible authentication providers
// This matches the auth_provider choices in the backend CustomUser model
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

// Define user preferences structure
// This matches the preferences JSON field in the backend CustomUser model
export interface UserPreferences {
  // Theme preferences
  theme: 'light' | 'dark' | 'system'; // Theme preference
  
  // Notification settings
  notifications: {
    enabled: boolean;                // Whether notifications are enabled
    dueDateReminders: boolean;       // Reminders for due dates
    routineReminders: boolean;       // Reminders for routine tasks
    pushNotifications: boolean;      // Push notification permission
    emailNotifications: boolean;     // Email notification preference
  };
  
  // Task defaults
  defaultPriority: number;          // Default priority for new tasks (1-5)
  defaultColor: string;             // Default color for new tasks
  defaultListView: 'list' | 'grid'; // Default view for task lists
  
  // Date and time preferences
  timezone: string;                 // User's timezone (e.g., 'UTC', 'America/New_York')
  dateFormat: string;               // Date format preference (e.g., 'MM/DD/YYYY')
  timeFormat: '12h' | '24h';        // Time format preference
  
  // App behavior preferences
  autoArchiveCompleted: boolean;    // Auto-archive completed tasks
  showCompletedTasks: boolean;      // Show completed tasks in lists
  sortTasksBy: 'dueDate' | 'priority' | 'createdAt' | 'title'; // Default task sorting
  
  // Privacy and data preferences
  analyticsEnabled: boolean;        // Allow usage analytics
  crashReportingEnabled: boolean;   // Allow crash reporting
}

// Main User interface that represents a user entity
// This interface matches the Django CustomUser model structure
export interface User {
  // Primary key - UUID string from backend
  id: string;
  
  // Authentication information
  email: string;                    // User's email address (required and unique)
  authProvider: AuthProvider;       // Authentication provider used
  authProviderId: string | null;    // Provider-specific user ID for social auth
  
  // Basic profile information
  firstName: string;                // User's first name
  lastName: string;                 // User's last name
  avatarUrl: string | null;         // URL to user's avatar image
  
  // Account status and verification
  isEmailVerified: boolean;         // Whether the user's email has been verified
  lastLogin: Date | null;           // Last time the user logged in
  
  // User preferences and settings
  preferences: UserPreferences;     // User preferences and app settings
  
  // Soft delete support
  softDeleted: boolean;             // Whether the user account has been soft deleted
  
  // Timestamps
  createdAt: Date;                  // When the user account was created
  updatedAt: Date;                  // When the user account was last updated
  
  // Optional fields for social auth users
  username?: string;                // Username (optional for social auth users)
  password?: string;                // Password hash (optional for social auth users)
}

// Type for user registration input
export interface RegisterUserInput {
  email: string;                    // Required: User's email
  password?: string;                // Optional: Password (for email auth)
  firstName?: string;               // Optional: First name
  lastName?: string;                // Optional: Last name
  authProvider?: AuthProvider;      // Optional: Auth provider (defaults to 'email')
  authProviderId?: string;          // Optional: Provider ID (for social auth)
  preferences?: Partial<UserPreferences>; // Optional: Initial preferences
}

// Type for user login input
export interface LoginUserInput {
  email: string;                    // Required: User's email
  password: string;                 // Required: User's password (for email auth)
}

// Type for social authentication input
export interface SocialAuthInput {
  authProvider: 'google' | 'apple' | 'facebook'; // Required: Social provider
  authProviderId: string;           // Required: Provider-specific user ID
  email: string;                    // Required: User's email from provider
  firstName?: string;               // Optional: First name from provider
  lastName?: string;               // Optional: Last name from provider
  avatarUrl?: string;              // Optional: Avatar URL from provider
}

// Type for updating user profile
export interface UpdateUserInput {
  firstName?: string;               // Optional: New first name
  lastName?: string;                // Optional: New last name
  avatarUrl?: string | null;        // Optional: New avatar URL
  preferences?: Partial<UserPreferences>; // Optional: Updated preferences
}

// Type for updating user preferences
export interface UpdateUserPreferencesInput {
  theme?: UserPreferences['theme']; // Optional: New theme preference
  notifications?: Partial<UserPreferences['notifications']>; // Optional: Updated notification settings
  defaultPriority?: number;         // Optional: New default priority
  defaultColor?: string;            // Optional: New default color
  defaultListView?: UserPreferences['defaultListView']; // Optional: New default list view
  timezone?: string;                // Optional: New timezone
  dateFormat?: string;              // Optional: New date format
  timeFormat?: UserPreferences['timeFormat']; // Optional: New time format
  autoArchiveCompleted?: boolean;   // Optional: Auto-archive setting
  showCompletedTasks?: boolean;     // Optional: Show completed tasks setting
  sortTasksBy?: UserPreferences['sortTasksBy']; // Optional: New default sorting
  analyticsEnabled?: boolean;       // Optional: Analytics preference
  crashReportingEnabled?: boolean;  // Optional: Crash reporting preference
}

// Type for user statistics
export interface UserStats {
  totalTasks: number;               // Total number of tasks created
  completedTasks: number;           // Number of completed tasks
  activeTasks: number;              // Number of active/pending tasks
  totalLists: number;               // Total number of lists created
  accountAge: number;               // Days since account creation
  lastActiveDate: Date | null;      // Last time user was active
}

// Type for user session information
export interface UserSession {
  user: User;                       // User information
  accessToken: string;              // JWT access token
  refreshToken: string;             // JWT refresh token
  expiresAt: Date;                  // When the session expires
  isAuthenticated: boolean;         // Whether the user is currently authenticated
}

// Type for password change input
export interface ChangePasswordInput {
  currentPassword: string;          // Required: Current password
  newPassword: string;              // Required: New password
  confirmPassword: string;          // Required: Password confirmation
}

// Type for password reset request
export interface PasswordResetRequestInput {
  email: string;                    // Required: User's email address
}

// Type for password reset confirmation
export interface PasswordResetConfirmInput {
  token: string;                    // Required: Reset token from email
  newPassword: string;              // Required: New password
  confirmPassword: string;          // Required: Password confirmation
}
