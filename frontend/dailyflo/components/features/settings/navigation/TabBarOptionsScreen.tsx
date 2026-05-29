/**
 * Tab Bar options — pick a tab to add to the navbar (pushed from Navigation settings Add row).
 * Tabs already on the bar are ghosted; available tabs are tappable and slide back after add.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon, GearIcon } from '@/components/ui/Icon';
import { DisplaySettingsSubScreenShell } from '@/components/features/display/DisplaySettingsSubScreenShell';
import { Paddings } from '@/constants/Paddings';

import { useNavigationSettingsDraft } from './NavigationSettingsDraftContext';
import { ALL_NAV_TAB_OPTION_KEYS, NAV_TAB_REGISTRY, type NavTabKey } from './navigationTabRegistry';

const GROUPED_LIST_ICON_COLUMN = 30;

export function TabBarOptionsScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const { draftOrder, addTabToDraft } = useNavigationSettingsDraft();

  const groupedListIconColor = getMarpleBrandColor(500);
  const ghostIconColor = themeColors.text.tertiary();
  const ghostLabelColor = themeColors.text.tertiary();

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: GROUPED_LIST_ICON_COLUMN,
      containerStyle: styles.listContainer,
    }),
    [themeColors]
  );

  const handleSelectTab = useCallback(
    (key: NavTabKey) => {
      if (draftOrder.includes(key)) return;
      addTabToDraft(key);
      router.back();
    },
    [addTabToDraft, draftOrder, router]
  );

  return (
    <DisplaySettingsSubScreenShell title="Tab Bar">
      <View style={styles.groupedListSection}>
        <GroupedList {...listGroupProps}>
          {ALL_NAV_TAB_OPTION_KEYS.map((key) => {
            const meta = NAV_TAB_REGISTRY[key];
            const alreadyInBar = draftOrder.includes(key);
            const iconColor = alreadyInBar ? ghostIconColor : groupedListIconColor;

            return (
              <FormDetailButton
                key={key}
                iconComponent={
                  <SFSymbolIcon
                    name={meta.sfSymbol as any}
                    size={18}
                    color={iconColor}
                    fallback={<GearIcon size={18} color={iconColor} />}
                  />
                }
                label={meta.label}
                value=""
                disabled={alreadyInBar}
                onPress={() => handleSelectTab(key)}
                showChevron={false}
                customStyles={
                  alreadyInBar
                    ? {
                        label: { color: ghostLabelColor, opacity: 0.55 },
                      }
                    : undefined
                }
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

export default TabBarOptionsScreen;
