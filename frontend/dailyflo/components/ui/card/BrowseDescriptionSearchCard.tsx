/**
 * browse search row when the Description chip matches task body text — same outer chrome as TaskCard / BrowseListSearchCard
 * paragraph icon in the checkbox slot; first line = description snippet with query highlighted; second line = task title; trailing = leaf + list/inbox like TaskCard
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ParagraphIcon, LeafIcon } from '@/components/ui/icon';
import { DashedSeparator } from '@/components/ui/borders';
import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

const PARAGRAPH_IN_SLOT = 18;
const LEAF_SIZE = 14;

export type BrowseDescriptionSearchCardProps = {
  /** task whose description matched (we show description + title + list) */
  descriptionText: string;
  taskTitle: string;
  /** raw query for highlighting inside description */
  query: string;
  /** inbox or list name — same string Task browse search uses on the right */
  listOrInboxLabel: string;
  onPress: () => void;
  isLastItem?: boolean;
  separatorPaddingHorizontal?: number;
  cardSpacing?: number;
};

/** split description into before / match / after for nested Text highlight (case-insensitive index) */
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

export function BrowseDescriptionSearchCard({
  descriptionText,
  taskTitle,
  query,
  listOrInboxLabel,
  onPress,
  isLastItem = true,
  separatorPaddingHorizontal = 0,
  cardSpacing = 0,
}: BrowseDescriptionSearchCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = useMemo(
    () => createStyles(themeColors, typography, cardSpacing),
    [themeColors, typography, cardSpacing]
  );

  const highlight = descriptionHighlightParts(descriptionText, query);
  const primary = themeColors.text.primary();
  const tertiary = themeColors.text.tertiary();
  const highlightColor = themeColors.interactive.primary();

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
            accessibilityLabel={`${taskTitle}, description match`}
          >
            <View style={styles.contentColumn}>
              {/* top line: description (match emphasized) + same leaf+list cluster as task search */}
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
                <View style={styles.leafListCluster}>
                  <LeafIcon size={LEAF_SIZE} color={tertiary} />
                  <Text style={[styles.listLabel, { color: tertiary }]} numberOfLines={1} ellipsizeMode="tail">
                    {listOrInboxLabel}
                  </Text>
                </View>
              </View>
              {/* second line: task title — secondary, under description */}
              <Text
                style={[styles.taskTitleSub, { color: themeColors.text.secondary() }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {taskTitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {!isLastItem ? (
        <DashedSeparator
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
    leafListCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      flexShrink: 0,
      maxWidth: '46%',
      marginLeft: 4,
      paddingTop: 2,
    },
    listLabel: {
      ...typography.getTextStyle('body-medium'),
      flexShrink: 1,
      minWidth: 0,
      textAlign: 'left',
    },
    taskTitleSub: {
      ...typography.getTextStyle('body-small'),
      marginTop: 2,
    },
  });
}
