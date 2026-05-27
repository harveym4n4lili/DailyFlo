/**
 * Sorting picker — writes to DisplaySettingsDraftContext; save lives on Display root only.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon, TickIcon } from '@/components/ui/Icon';
import { useDisplaySettingsDraft } from '@/components/features/display/DisplaySettingsDraftContext';
import { DisplaySettingsSubScreenShell } from '@/components/features/display/DisplaySettingsSubScreenShell';
import { DISPLAY_SORT_OPTION_TITLES } from '@/components/features/display/displayStackChrome';
import { DISPLAY_SORTING_OPTIONS } from '@/components/features/display/displaySortOptions';
import { Paddings } from '@/constants/Paddings';

const SORT_OPTION_ICON_SIZE = Paddings.groupedListIconSize;

export function DisplaySortingSelectScreen() {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const { draft, setSortOption } = useDisplaySettingsDraft();

  const marpleAccent = getMarpleBrandColor(500);

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: false,
      containerStyle: styles.listContainer,
    }),
    [themeColors]
  );

  const renderSelectionTick = useCallback(
    () => (
      <SFSymbolIcon
        name="checkmark"
        size={SORT_OPTION_ICON_SIZE}
        color={marpleAccent}
        fallback={<TickIcon size={SORT_OPTION_ICON_SIZE} color={marpleAccent} />}
      />
    ),
    [marpleAccent]
  );

  return (
    <DisplaySettingsSubScreenShell title={DISPLAY_SORT_OPTION_TITLES.sorting}>
      <View style={styles.groupedListSection}>
        <GroupedList {...listGroupProps}>
          {DISPLAY_SORTING_OPTIONS.map((option) => {
            const isSelected = draft.sortOption === option;
            return (
              <FormDetailButton
                key={option}
                label={option}
                showChevron={false}
                value={isSelected ? renderSelectionTick() : undefined}
                onPress={() => setSortOption(option)}
              />
            );
          })}
        </GroupedList>
      </View>
    </DisplaySettingsSubScreenShell>
  );
}

const styles = StyleSheet.create({
  groupedListSection: {
    paddingTop: 0,
  },
  listContainer: {
    marginVertical: 0,
  },
});

export default DisplaySortingSelectScreen;
