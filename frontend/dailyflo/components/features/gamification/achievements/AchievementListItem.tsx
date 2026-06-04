/**
 * one achievement row on the achievements screen — locked vs unlocked styling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { SFSymbolIcon } from '@/components/ui/Icon';
import type { AchievementItem } from '@/types/api/gamification';

export type AchievementListItemProps = {
  item: AchievementItem;
};

export function AchievementListItem({ item }: AchievementListItemProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor, withOpacity } = useBrandColors();
  const typography = useTypography();
  const unlocked = item.unlockedAt != null;

  // marple brand — same accent as productivity hub / progress board icons
  const brandIconColor = getMarpleBrandColor(500);
  const achievementIconColor = unlocked ? brandIconColor : withOpacity(brandIconColor, 0.45);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: themeColors.background.primarySecondaryBlend(),
          opacity: unlocked ? 1 : 0.65,
        },
      ]}
    >
      <SFSymbolIcon
        name={item.iconKey as any}
        size={24}
        color={achievementIconColor}
      />
      <View style={styles.rowText}>
        <Text style={[typography.getTextStyle('body-large'), { color: themeColors.text.primary() }]}>
          {item.title}
        </Text>
        <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
          {item.description}
        </Text>
        {!unlocked && item.progressLabel ? (
          <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.tertiary() }]}>
            {item.progressLabel}
          </Text>
        ) : null}
      </View>
      {unlocked ? (
        <SFSymbolIcon name="checkmark.seal.fill" size={20} color={brandIconColor} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.groupedListIconTextSpacing,
    padding: Paddings.groupedListContentHorizontal,
    borderRadius: Paddings.formDataPillRadius,
  },
  rowText: {
    flex: 1,
    gap: Paddings.touchTargetSmall,
  },
});
