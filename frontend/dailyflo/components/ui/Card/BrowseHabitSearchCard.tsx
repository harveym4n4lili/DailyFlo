/**
 * browse search result row for a habit — mirrors BrowseListSearchCard chrome.
 * empty progress ring in the checkbox slot; title uses habit palette shade 300 + heading-4 (same as task title).
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { HabitProgressRing } from '@/components/features/habits/list/HabitProgressRing';
import { getHabitProgressRingColors } from '@/components/features/habits/list/habitProgressRingColors';
import { SolidSeparator } from '@/components/ui/borders';
import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { getTaskColorValue } from '@/utils/taskColors';
import type { HabitColor } from '@/types/api/habits';

export type BrowseHabitSearchCardProps = {
  title: string;
  color: HabitColor;
  onPress: () => void;
  isLastItem?: boolean;
  separatorPaddingHorizontal?: number;
  cardSpacing?: number;
};

export function BrowseHabitSearchCard({
  title,
  color,
  onPress,
  isLastItem = true,
  separatorPaddingHorizontal = 0,
  cardSpacing = 0,
}: BrowseHabitSearchCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(() => createStyles(themeColors, typography, cardSpacing), [themeColors, typography, cardSpacing]);
  const ringColors = useMemo(() => getHabitProgressRingColors(color), [color]);
  const titleColor = useMemo(() => getTaskColorValue(color, 300), [color]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onPress();
  };

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, styles.transparentBackground, styles.noInnerPadding]}>
        <View style={styles.contentRow}>
          {/* decorative empty ring — same footprint as TaskCardCheckbox */}
          <View style={styles.ringSlot} pointerEvents="none">
            <HabitProgressRing
              current={0}
              target={1}
              color={ringColors.progress}
              trackColor={ringColors.track}
              iconColor={ringColors.icon}
              size={CHECKBOX_SIZE_DEFAULT}
              showRing
              showCenterPlus={false}
              showCenterLabel={false}
              accessibilityLabel={undefined}
            />
          </View>

          <TouchableOpacity
            style={styles.cardContentTouchable}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${title}, habit`}
          >
            <View style={styles.contentColumn}>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <View style={styles.titleWrapper}>
                    <View style={[styles.titleTextWrapper, styles.titleTextWrapperWithMargin]}>
                      <Text style={[styles.title, { color: titleColor }]} numberOfLines={2} ellipsizeMode="tail">
                        {title}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.rightLabel, { color: themeColors.text.tertiary() }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Habit
                  </Text>
                </View>
              </View>
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
      alignItems: 'center',
    },
    ringSlot: {
      width: CHECKBOX_SIZE_DEFAULT,
      height: CHECKBOX_SIZE_DEFAULT,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      zIndex: 1,
    },
    cardContentTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    contentColumn: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    titleWrapper: {
      flex: 1,
      flexShrink: 1,
    },
    titleTextWrapper: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      position: 'relative',
    },
    titleTextWrapperWithMargin: {
      marginTop: 1,
    },
    title: {
      ...typography.getTextStyle('heading-4'),
    },
    rightLabel: {
      ...typography.getTextStyle('body-medium'),
      width: 90,
      textAlign: 'right',
      flexShrink: 0,
    },
  });
}
