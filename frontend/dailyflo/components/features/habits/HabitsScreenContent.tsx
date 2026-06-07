/**
 * habits tab body — placeholder content for now; full habit tracking will plug in here later.
 * uses the same dashboard chrome shell as the AI tab (top row + ScreenContainer).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/index';
import { ScreenHeaderActions } from '@/components/ui';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

// matches planner / AI topSectionRow height — content starts below this + safe top inset
const TOP_SECTION_ROW_HEIGHT = 48;

export function HabitsScreenContent() {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () => createStyles(themeColors, typography, insets),
    [themeColors, typography, insets],
  );

  return (
    <>
      {/* android: glass dashboard chip; ios: overflow icons live in Stack.Toolbar via the route wrapper */}
      <View
        style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ROW_HEIGHT }]}
        pointerEvents="box-none"
      >
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionCloseButton} pointerEvents="none" />
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : null}
        </View>
      </View>

      {/* full-bleed container — we apply safe-area padding inside the scroll body */}
      <ScreenContainer
        scrollable={false}
        paddingHorizontal={0}
        safeAreaTop={false}
        safeAreaBottom={false}
        paddingVertical={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.hint}>
            Track daily habits here. Full habit tracking coming soon.
          </Text>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
) =>
  StyleSheet.create({
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 'auto',
    },
    topSectionContextButton: {
      backgroundColor: 'primary',
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: insets.top + TOP_SECTION_ROW_HEIGHT + 8,
      paddingHorizontal: Paddings.screen,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.contentVertical,
    },
    title: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
    },
    hint: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.secondary(),
      marginTop: 8,
    },
  });
