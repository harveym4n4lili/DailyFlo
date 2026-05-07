/**
 * intro segment — `Slot` only so `router.push('/onboarding')` runs on the root stack.
 * header chrome lives on the root `Stack.Screen name="introductory"` (see `headerChrome.tsx`).
 */

import { Slot } from 'expo-router';

export default function IntroductoryLayout() {
  return <Slot />;
}
