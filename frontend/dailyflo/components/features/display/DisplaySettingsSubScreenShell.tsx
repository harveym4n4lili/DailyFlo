/**
 * pushed screen inside the display modal stack (sorting / date / priority).
 * ios: chevron.back in Stack.Toolbar + native headerTitle; android: glass back + in-screen title.
 * save/apply lives on the Display root only — not on sub-screens.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { Paddings } from '@/constants/Paddings';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

export type DisplaySettingsSubScreenShellProps = {
  title: string;
  children?: React.ReactNode;
};

export function DisplaySettingsSubScreenShell({ title, children }: DisplaySettingsSubScreenShellProps) {
  const router = useGuardedRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typography = useTypography();

  const headerHeight = useHeaderHeight();
  const headerTitleStyle = useMemo(
    () => ({
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    }),
    [typography, themeColors]
  );
  const topSectionHeight =
    Platform.OS === 'ios' ? headerHeight + FADE_OVERFLOW : TOP_SECTION_HEIGHT;
  const scrollTopPadding =
    Platform.OS === 'ios' ? headerHeight + 24 : HEADER_TOP + HEADER_ROW_HEIGHT + 24;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerTitle: title,
            headerTitleStyle,
            headerLargeTitle: false,
          }}
        />
      ) : null}
      {isFocused ? <IosBrowseBackStackToolbar /> : null}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: scrollTopPadding, paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
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
        {Platform.OS === 'android' && isFocused ? (
          <>
            <View style={[styles.headerRow, { top: HEADER_TOP }]} pointerEvents="box-none">
              <View style={styles.headerPlaceholder} pointerEvents="none" />
              <View style={styles.headerCenter} pointerEvents="none">
                <Text style={headerTitleStyle}>{title}</Text>
              </View>
              <View style={styles.headerPlaceholder} pointerEvents="none" />
            </View>
            <View style={styles.headerActionsContainer} pointerEvents="box-none">
              <MainBackButton onPress={() => router.back()} top={Paddings.screen} left={Paddings.screen} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Paddings.screen,
    flexGrow: 1,
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
  headerRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_ROW_HEIGHT,
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
    height: TOP_SECTION_HEIGHT,
    zIndex: 11,
    overflow: 'visible',
  },
});
