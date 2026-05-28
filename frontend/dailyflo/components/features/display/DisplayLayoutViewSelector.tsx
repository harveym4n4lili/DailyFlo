/**
 * Layout view picker — two phone-preview placeholders (list vs timeline).
 * Writes to DisplaySettingsDraftContext; real mini graphics can replace the bordered boxes later.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useDisplaySettingsDraft } from '@/components/features/display/DisplaySettingsDraftContext';
import {
  DISPLAY_LAYOUT_VIEW_OPTIONS,
  type DisplayLayoutView,
} from '@/components/features/display/displayLayoutOptions';
import { Paddings } from '@/constants/Paddings';

// placeholder “phone screen” size until real list/timeline graphics land
const LAYOUT_PREVIEW_HEIGHT = 128;
const LAYOUT_PREVIEW_BORDER_RADIUS = 16;
const LAYOUT_OPTION_GAP = Paddings.sectionCompact;

export function DisplayLayoutViewSelector() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const { getMarpleBrandColor } = useColorPalette();
  const { draft, setLayoutView } = useDisplaySettingsDraft();

  const marpleAccent = getMarpleBrandColor(500);
  const unselectedBorderColor = themeColors.border.primary();

  const labelStyle = useMemo(
    () => typography.getTextStyle('body-medium'),
    [typography]
  );

  const renderOption = useCallback(
    (id: DisplayLayoutView, label: string) => {
      const isSelected = draft.layoutView === id;

      return (
        <Pressable
          key={id}
          onPress={() => setLayoutView(id)}
          style={styles.option}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={label}
        >
          <View
            style={[
              styles.preview,
              {
                borderColor: isSelected ? marpleAccent : unselectedBorderColor,
                borderWidth: isSelected ? 2 : 1,
                backgroundColor: themeColors.background.elevated(),
              },
            ]}
          />
          <Text
            style={[
              labelStyle,
              {
                color: isSelected ? themeColors.text.primary() : themeColors.text.secondary(),
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Pressable>
      );
    },
    [
      draft.layoutView,
      labelStyle,
      marpleAccent,
      setLayoutView,
      themeColors,
      unselectedBorderColor,
    ]
  );

  return (
    <View style={styles.row}>
      {DISPLAY_LAYOUT_VIEW_OPTIONS.map(({ id, label }) => renderOption(id, label))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: LAYOUT_OPTION_GAP,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  preview: {
    width: '100%',
    height: LAYOUT_PREVIEW_HEIGHT,
    borderRadius: LAYOUT_PREVIEW_BORDER_RADIUS,
    marginBottom: Paddings.groupedListIconTextSpacing,
  },
});

export default DisplayLayoutViewSelector;
