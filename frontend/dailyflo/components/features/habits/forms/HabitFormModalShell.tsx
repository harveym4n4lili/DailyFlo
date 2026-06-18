/**
 * modal chrome for habit create/edit — blur header band + scroll under overlay (browse list-create pattern).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useKeyboardHeight } from '@/components/layout/ScreenLayout';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/Button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { Paddings } from '@/constants/Paddings';
import {
  HABIT_FORM_FADE_OVERFLOW,
  HABIT_FORM_HEADER_ROW_HEIGHT,
  HABIT_FORM_HEADER_TOP,
  HABIT_FORM_TOP_SECTION_HEIGHT,
} from './habitFormChrome';

type HabitFormModalShellProps = {
  headerTitle: string;
  canSubmit: boolean;
  onSubmit: () => void;
  submitAccessibilityLabel: string;
  children: React.ReactNode;
};

export function HabitFormModalShell({
  headerTitle,
  canSubmit,
  onSubmit,
  submitAccessibilityLabel,
  children,
}: HabitFormModalShellProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(() => createStyles(), []);

  const headerHeight = useHeaderHeight();
  const headerTitleStyle = useMemo(
    () => ({
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    }),
    [typography, themeColors],
  );
  const topSectionHeight =
    Platform.OS === 'ios' ? headerHeight + HABIT_FORM_FADE_OVERFLOW : HABIT_FORM_TOP_SECTION_HEIGHT;
  const scrollTopPadding =
    Platform.OS === 'ios' ? headerHeight + 24 : HABIT_FORM_HEADER_TOP + HABIT_FORM_HEADER_ROW_HEIGHT + 24;

  // extra scroll inset when keyboard is open — same idea as TaskScreenContent so name/description stay visible
  const keyboardHeight = useKeyboardHeight();
  const scrollBottomPadding = keyboardHeight > 0 ? keyboardHeight + 32 : 200;

  return (
    <>
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerTitle,
            headerTitleStyle,
            headerLargeTitle: false,
          }}
        />
      ) : null}
      <IosBrowseModalCloseStackToolbar />
      <IosBrowseModalTrailingStackToolbar
        icon="checkmark"
        onPress={onSubmit}
        disabled={!canSubmit}
        brandActive={canSubmit}
        accessibilityLabel={submitAccessibilityLabel}
      />
      <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: scrollTopPadding, paddingBottom: scrollBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {children}
          </ScrollView>
        </View>

        <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
          <View style={[styles.topSectionAnchor, { height: topSectionHeight }]} pointerEvents="box-none">
            <BlurView
              tint={themeColors.isDark ? 'dark' : 'light'}
              intensity={1}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[
                themeColors.background.primary(),
                themeColors.withOpacity(themeColors.background.primary(), 0),
              ]}
              locations={[0.4, 0.8]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
          {Platform.OS === 'android' ? (
            <>
              <View style={[styles.headerRow, { top: HABIT_FORM_HEADER_TOP }]} pointerEvents="box-none">
                <View style={styles.headerPlaceholder} pointerEvents="none" />
                <View style={styles.headerCenter} pointerEvents="none">
                  <Text style={headerTitleStyle}>{headerTitle}</Text>
                </View>
                <View style={styles.headerPlaceholder} pointerEvents="none" />
              </View>
              <View style={styles.headerActionsContainer} pointerEvents="box-none">
                <MainCloseButton onPress={() => router.back()} top={Paddings.screen} left={Paddings.screen} />
                <MainSubmitButton
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  top={Paddings.screen}
                  right={Paddings.screen}
                  accessibilityLabel={submitAccessibilityLabel}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentArea: {
      flex: 1,
      zIndex: 0,
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
    },
    headerRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: HABIT_FORM_HEADER_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
      zIndex: 10,
    },
    headerPlaceholder: {
      width: 44,
      height: 44,
    },
    headerCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: HABIT_FORM_TOP_SECTION_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
  });
