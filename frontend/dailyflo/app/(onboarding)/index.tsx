/**
 * onboarding group entry — first stack screen points users at the introductory route.
 */

import { Redirect } from 'expo-router';

export default function OnboardingEntryRedirect() {
  // normalized url for expo-router typed hrefs (`introductory` → `introductory/index`)
  return <Redirect href="/(onboarding)/introductory" />;
}
