/**
 * achievement unlock toast — slides in after a habit completion unlocks a trophy.
 * reads pending unlock from redux gamification slice; auto-dismisses after a few seconds.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { SFSymbolIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';
import { useBrandColors, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearPendingAchievementUnlock } from '@/store/slices/gamification/gamificationSlice';

const AUTO_DISMISS_MS = 4500;

export function AchievementUnlockBanner() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { getMarpleBrandColor } = useBrandColors();
  const pendingUnlock = useAppSelector((state) => state.gamification.pendingAchievementUnlock);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  const styles = useMemo(
    () => createStyles(themeColors, typography, getMarpleBrandColor(500), insets.top),
    [themeColors, typography, getMarpleBrandColor, insets.top],
  );

  const dismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(-120, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(dispatch)(clearPendingAchievementUnlock());
      }
    });
  };

  useEffect(() => {
    if (!pendingUnlock) {
      translateY.value = -120;
      opacity.value = 0;
      return;
    }

    // success haptic when a new trophy unlocks from habit progress
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 200 });

    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [pendingUnlock?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!pendingUnlock) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.host, animatedStyle]}>
      <Pressable
        onPress={dismiss}
        style={styles.card}
        accessibilityRole="alert"
        accessibilityLabel={`Achievement unlocked: ${pendingUnlock.title}`}
      >
        <View style={styles.iconWrap}>
          <SFSymbolIcon
            name={pendingUnlock.iconKey as any}
            size={28}
            color={getMarpleBrandColor(500)}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>Achievement unlocked</Text>
          <Text style={styles.title} numberOfLines={1}>
            {pendingUnlock.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {pendingUnlock.description}
          </Text>
        </View>
        <SFSymbolIcon name="checkmark.seal.fill" size={22} color={getMarpleBrandColor(500)} />
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  brandColor: string,
  safeTop: number,
) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      top: safeTop + 8,
      left: Paddings.screen,
      right: Paddings.screen,
      zIndex: 200,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Paddings.groupedListIconTextSpacing,
      padding: Paddings.groupedListContentHorizontal,
      borderRadius: Paddings.formDataPillRadius,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: themeColors.withOpacity(brandColor, 0.35),
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.withOpacity(brandColor, 0.12),
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    eyebrow: {
      ...typography.getTextStyle('body-small'),
      color: brandColor,
      fontWeight: '600',
    },
    title: {
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.primary(),
      fontWeight: '600',
    },
    description: {
      ...typography.getTextStyle('body-small'),
      color: themeColors.text.secondary(),
    },
  });
