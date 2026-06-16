/**
 * achievement toast card — neutral primary[100] fill + secondary border token.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SFSymbolIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import type { AchievementUnlockToastPayload } from './achievementUnlockToastTypes';

type AchievementToastCardProps = {
  achievement: AchievementUnlockToastPayload;
  brandColor: string;
  onDismiss: () => void;
};

export function AchievementToastCard({ achievement, brandColor, onDismiss }: AchievementToastCardProps) {
  const themeColors = useThemeColors();
  const { primary } = useColorPalette();
  const typography = useTypography();

  const content = (
    <>
      <View style={styles.iconWrap}>
        <SFSymbolIcon
          name={achievement.iconKey as any}
          size={28}
          color={brandColor}
          fallback={<Text style={[styles.iconFallback, { color: brandColor }]}>★</Text>}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.eyebrow, typography.getTextStyle('body-small'), { color: brandColor }]}>
          Achievement unlocked
        </Text>
        <Text
          style={[styles.title, typography.getTextStyle('body-large'), { color: themeColors.text.primary() }]}
          numberOfLines={1}
        >
          {achievement.title}
        </Text>
        <Text
          style={[
            styles.description,
            typography.getTextStyle('body-small'),
            { color: themeColors.text.secondary() },
          ]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
      </View>
      <SFSymbolIcon
        name="checkmark.seal.fill"
        size={22}
        color={brandColor}
        fallback={<Text style={[styles.iconFallback, { color: brandColor }]}>✓</Text>}
      />
    </>
  );

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLabel={`Achievement unlocked: ${achievement.title}`}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.card,
          {
            // primary[100] = neutral step 100 (#F5F7FA light / #373737 dark) — not theme background.primary (dark uses 25)
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderColor: themeColors.background.secondary(),
          },
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.groupedListIconTextSpacing,
    padding: Paddings.groupedListContentHorizontal,
    borderRadius: Paddings.groupedListBorderRadius,
    borderWidth: 1,
    elevation: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontWeight: '600',
  },
  title: {
    fontWeight: '600',
  },
  description: {},
  iconFallback: {
    fontSize: 18,
    fontWeight: '600',
  },
});
