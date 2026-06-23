/**
 * browse search row when a habit description matched — same chrome as BrowseDescriptionSearchCard.
 * paragraph icon in checkbox slot; habit title on second line in palette shade 300; trailing "Habit".
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ParagraphIcon } from '@/components/ui/Icon';
import { SolidSeparator } from '@/components/ui/borders';
import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor } from '@/types/api/habits';

const PARAGRAPH_IN_SLOT = 18;

export type BrowseHabitDescriptionSearchCardProps = {
  descriptionText: string;
  habitTitle: string;
  habitColor: HabitColor;
  query: string;
  onPress: () => void;
  isLastItem?: boolean;
  separatorPaddingHorizontal?: number;
  cardSpacing?: number;
};

function descriptionHighlightParts(text: string, q: string): { before: string; match: string; after: string } | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const lower = text.toLowerCase();
  const qi = lower.indexOf(trimmed.toLowerCase());
  if (qi < 0) return null;
  return {
    before: text.slice(0, qi),
    match: text.slice(qi, qi + trimmed.length),
    after: text.slice(qi + trimmed.length),
  };
}

export function BrowseHabitDescriptionSearchCard({
  descriptionText,
  habitTitle,
  habitColor,
  query,
  onPress,
  isLastItem = true,
  separatorPaddingHorizontal = 0,
  cardSpacing = 0,
}: BrowseHabitDescriptionSearchCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () => createStyles(themeColors, typography, cardSpacing),
    [themeColors, typography, cardSpacing],
  );

  const highlight = descriptionHighlightParts(descriptionText, query);
  const primary = themeColors.text.primary();
  const tertiary = themeColors.text.tertiary();
  const highlightColor = themeColors.interactive.primary();
  const titleColor = useMemo(() => getTaskColorValue(habitColor, 300), [habitColor]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onPress();
  };

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, styles.transparentBackground, styles.noInnerPadding]}>
        <View style={styles.contentRow}>
          <View style={styles.iconSlot}>
            <ParagraphIcon size={PARAGRAPH_IN_SLOT} color={tertiary} />
          </View>

          <TouchableOpacity
            style={styles.cardContentTouchable}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${habitTitle}, habit description match`}
          >
            <View style={styles.contentColumn}>
              <View style={styles.titleRow}>
                <View style={styles.descTitleWrap}>
                  {highlight ? (
                    <Text style={[styles.descriptionPrimary, { color: primary }]} numberOfLines={2} ellipsizeMode="tail">
                      {highlight.before}
                      <Text style={[styles.descriptionPrimary, { color: highlightColor }]}>{highlight.match}</Text>
                      {highlight.after}
                    </Text>
                  ) : (
                    <Text style={[styles.descriptionPrimary, { color: primary }]} numberOfLines={2} ellipsizeMode="tail">
                      {descriptionText}
                    </Text>
                  )}
                </View>
                <Text style={[styles.habitLabel, { color: tertiary }]} numberOfLines={1} ellipsizeMode="tail">
                  Habit
                </Text>
              </View>
              <Text style={[styles.habitTitleSub, { color: titleColor }]} numberOfLines={1} ellipsizeMode="tail">
                {habitTitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {!isLastItem ? (
        <SolidSeparator paddingLeft={CHECKBOX_SIZE_DEFAULT + 12} paddingRight={0} />
      ) : null}
    </View>
  );
}

function createStyles(
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  cardSpacing: number,
) {
  return StyleSheet.create({
    cardContainer: {
      width: '100%',
      marginBottom: cardSpacing,
      position: 'relative',
      alignItems: 'stretch',
    },
    card: {
      width: '100%',
      backgroundColor: themeColors.background.elevated(),
      borderRadius: 0,
      padding: Paddings.card,
      paddingRight: Paddings.taskCardRightPadding,
      position: 'relative',
      overflow: 'visible',
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
    noInnerPadding: {
      paddingHorizontal: Paddings.none,
      paddingLeft: Paddings.none,
      paddingRight: Paddings.none,
      paddingTop: Paddings.card,
      paddingBottom: Paddings.card,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconSlot: {
      width: CHECKBOX_SIZE_DEFAULT,
      minHeight: CHECKBOX_SIZE_DEFAULT,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 2,
    },
    cardContentTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    contentColumn: {
      flex: 1,
      flexDirection: 'column',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    descTitleWrap: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    descriptionPrimary: {
      ...typography.getTextStyle('heading-4'),
    },
    habitLabel: {
      ...typography.getTextStyle('body-medium'),
      flexShrink: 0,
      maxWidth: '46%',
      marginLeft: 4,
      paddingTop: 2,
      textAlign: 'right',
    },
    habitTitleSub: {
      ...typography.getTextStyle('body-small'),
      marginTop: 2,
    },
  });
}
