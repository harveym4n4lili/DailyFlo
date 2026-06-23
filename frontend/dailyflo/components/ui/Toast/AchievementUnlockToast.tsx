/**
 * global achievement unlock toast — absolute overlay (not Modal) so touches pass through to the app.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';
import { useBrandColors } from '@/hooks/useColorPalette';
import { AchievementToastCard } from './AchievementToastCard';
import { useAchievementUnlockToastController } from './useAchievementUnlockToastController';

export function AchievementUnlockToast() {
  const insets = useSafeAreaInsets();
  const { getMarpleBrandColor } = useBrandColors();
  const brandColor = getMarpleBrandColor(500);
  const { pendingUnlock, dismiss, animatedStyle } = useAchievementUnlockToastController();

  const hostStyle = useMemo(
    () => [styles.host, { top: insets.top + 8 }, animatedStyle],
    [insets.top, animatedStyle],
  );

  if (!pendingUnlock) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={hostStyle} pointerEvents="box-none">
        <AchievementToastCard
          achievement={pendingUnlock}
          brandColor={brandColor}
          onDismiss={dismiss}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  host: {
    position: 'absolute',
    left: Paddings.screen,
    right: Paddings.screen,
  },
});
