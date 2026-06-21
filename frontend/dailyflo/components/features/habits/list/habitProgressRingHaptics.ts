/**
 * haptic feedback for the habit increment ring tap.
 * called directly from the ring gesture so every finger-down gets feedback immediately.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function playHabitRingTapHaptic() {
  // expo-haptics is native-only — web/simulator may no-op silently
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'ios') {
    // light impact is easy to feel on ios; selection haptic is often too subtle for quick taps
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
