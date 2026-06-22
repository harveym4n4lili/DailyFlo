/**
 * shared scroll + close chrome for habit picker formSheets — mirrors task alert/time sheets.
 */

import React, { type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainCloseButton } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import {
  ALERT_SHEET_CLOSE_TOP,
  ALERT_SHEET_HEADER_TRAILING_INSET,
  ALERT_SHEET_HORIZONTAL_INSET,
  ALERT_SHEET_SCROLL_PADDING_TOP,
} from '@/components/features/tasks/TaskScreen/modals/alertSheetChrome';

const HEADING_GAP = Paddings.listItemVertical + Paddings.groupedListHeaderContentGap;

type HabitPickerSheetChromeProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function HabitPickerSheetChrome({ title, subtitle, onClose, children }: HabitPickerSheetChromeProps) {
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: ALERT_SHEET_SCROLL_PADDING_TOP,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
            paddingHorizontal: ALERT_SHEET_HORIZONTAL_INSET,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            getTypographyStyle('heading-3', typographyPlatform),
            styles.heading,
            {
              color: themeColors.text.primary(),
              paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,
            },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              getTypographyStyle('body-medium', typographyPlatform),
              styles.subtitle,
              { color: themeColors.text.secondary() },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        {children}
      </ScrollView>

      <View style={styles.headerOverlay} pointerEvents="box-none">
        <MainCloseButton
          onPress={onClose}
          top={ALERT_SHEET_CLOSE_TOP}
          right={ALERT_SHEET_HORIZONTAL_INSET}
          iconEmphasis="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  heading: {
    marginBottom: HEADING_GAP,
  },
  subtitle: {
    marginTop: -Paddings.listItemVertical,
    marginBottom: HEADING_GAP,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
