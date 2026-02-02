/**
 * FABTest Component
 *
 * Test floating action button that opens the test-modal Stack screen (liquid glass style).
 * Positioned on the left side of the screen (mirror of the main FAB) so you can test
 * modal flow without affecting the real add-task FAB. Uses router.push so the modal
 * is a real Stack screen with form sheet + transparent content when liquid glass is available.
 */

import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';

/**
 * Renders a FAB on the left side. On press, pushes the test-modal route (Stack screen).
 * Uses same vertical position as main FAB; left inset for left placement.
 */
export function FABTest() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const backgroundColor = themeColors.background.secondary();
  const iconColor = themeColors.text.primary();

  const handlePress = () => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // open test modal as a Stack screen (liquid glass form sheet when available)
    router.push('/test-modal');
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.fabContainer,
        {
          bottom: 48 + 16 + insets.bottom - 29,
          left: 16 + insets.left - 29,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.fab, { backgroundColor }]}
        accessibilityRole="button"
        accessibilityLabel="Open test modal"
        accessibilityHint="Double tap to open the test modal"
      >
        <Ionicons name="flask-outline" size={24} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 1000,
    width: 134,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 34,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    // simple shadow so the test FAB is visible on light/dark backgrounds
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
});

export default FABTest;
