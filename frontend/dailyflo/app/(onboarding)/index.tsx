/**
 * onboarding group entry — first stack screen sends users to the auth landing route.
 */

import { Redirect, type Href } from 'expo-router';

const AUTH_HREF = '/(onboarding)/auth' as Href;

export default function OnboardingEntryRedirect() {
  return <Redirect href={AUTH_HREF} />;
}
