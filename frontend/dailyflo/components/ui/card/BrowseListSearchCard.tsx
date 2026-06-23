/**
 * browse search result row for a user list — mirrors TaskCard chrome (same padding, row structure, solid rule)
 * leaf sits in the same box as TaskCardCheckbox; title row matches TaskCardContent with “List” instead of time range.
 * list-select reuses this card with metaText + isSelected + tray icon for Inbox/Habits bucket.
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LeafIcon, SFSymbolIcon } from '@/components/ui/Icon';
import { SolidSeparator } from '@/components/ui/borders';
import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

const LEAF_IN_CHECKBOX_SLOT = 18;

export type BrowseListSearchCardProps = {
  name: string;
  onPress: () => void;
  isLastItem?: boolean;
  separatorPaddingHorizontal?: number;
  cardSpacing?: number;
  /** list-select: tasks · habits subtitle under the title */
  metaText?: string;
  /** list-select: highlight picked row */
  isSelected?: boolean;
  /** override trailing label — defaults to "List" in browse, "Selected" when isSelected in list-select */
  rightLabel?: string;
  /** leaf = user list row; tray = Inbox / default Habits bucket */
  leadingIcon?: 'leaf' | 'tray';
};

export function BrowseListSearchCard({
  name,
  onPress,
  isLastItem = true,
  separatorPaddingHorizontal = 0,
  cardSpacing = 0,
  metaText,
  isSelected = false,
  rightLabel,
  leadingIcon = 'leaf',
}: BrowseListSearchCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(() => createStyles(themeColors, typography, cardSpacing), [themeColors, typography, cardSpacing]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onPress();
  };

  const trailingLabel = rightLabel ?? (isSelected ? 'Selected' : 'List');
  const trailingColor = isSelected ? themeColors.text.secondary() : themeColors.text.tertiary();
  const iconColor = themeColors.text.tertiary();

  const leadingNode =
    leadingIcon === 'tray' ? (
      <SFSymbolIcon
        name="tray.fill"
        size={LEAF_IN_CHECKBOX_SLOT}
        color={iconColor}
        fallback={<Ionicons name="file-tray" size={LEAF_IN_CHECKBOX_SLOT} color={iconColor} />}
      />
    ) : (
      <LeafIcon size={LEAF_IN_CHECKBOX_SLOT} color={iconColor} />
    );

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, styles.transparentBackground, styles.noInnerPadding]}>
        <View style={styles.contentRow}>
          <View style={[styles.leafSlot, metaText ? styles.leafSlotWithMeta : null]}>{leadingNode}</View>

          <TouchableOpacity
            style={styles.cardContentTouchable}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              metaText ? `${name}, ${metaText}${isSelected ? ', selected' : ''}` : `${name}, list`
            }
          >
            <View style={styles.contentColumn}>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <View style={styles.titleWrapper}>
                    <View style={[styles.titleTextWrapper, styles.titleTextWrapperWithMargin]}>
                      <Text style={[styles.title, { color: themeColors.text.primary() }]} numberOfLines={2} ellipsizeMode="tail">
                        {name}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.rightLabel, { color: trailingColor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {trailingLabel}
                  </Text>
                </View>
                {metaText ? (
                  <Text
                    style={[styles.metaText, { color: themeColors.text.tertiary() }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {metaText}
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {!isLastItem ? (
        <SolidSeparator
          paddingLeft={CHECKBOX_SIZE_DEFAULT + 12}
          paddingRight={separatorPaddingHorizontal}
        />
      ) : null}
    </View>
  );
}

function createStyles(
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  cardSpacing: number
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
    leafSlot: {
      width: CHECKBOX_SIZE_DEFAULT,
      height: CHECKBOX_SIZE_DEFAULT,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      zIndex: 1,
    },
    leafSlotWithMeta: {
      alignSelf: 'flex-start',
      marginTop: 2,
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
    metaText: {
      ...typography.getTextStyle('body-medium'),
      marginTop: 4,
    },
    rightLabel: {
      ...typography.getTextStyle('body-medium'),
      width: 90,
      textAlign: 'right',
      flexShrink: 0,
    },
  });
}
