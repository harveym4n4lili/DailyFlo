/**
 * Root Index Screen
 * 
 * This is the entry point when the app launches.
 * For testing onboarding, this temporarily redirects to the welcome screen.
 * 
 * TODO: Remove this file or update logic when implementing proper onboarding flow
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // TEMPORARY: Redirect to onboarding welcome screen for testing
  // Remove this or update logic when implementing proper onboarding check
  return <Redirect href="/(onboarding)/welcome" />;
  
  // FUTURE: This will check if user has completed onboarding
  // and redirect accordingly:
  // - If not completed → /(onboarding)/welcome
  // - If completed → /(tabs)
}
