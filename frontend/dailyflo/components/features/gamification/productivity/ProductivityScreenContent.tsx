/**
 * productivity hub — links to goals, achievements, and completed activity (browse stack).
 * screen shell matches AchievementsScreenContent (blur top band + title, scroll insets, padded body).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { SparklesIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export function ProductivityScreenContent() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);
  const { getMarpleBrandColor } = useBrandColors();
  const iconColor = getMarpleBrandColor(500);

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
      <View style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}>
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            themeColors.background.root(),
            themeColors.withOpacity(themeColors.background.root(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <View style={styles.topSectionTitleWrap} pointerEvents="none">
            <Text style={[styles.topSectionTitle, { color: themeColors.text.primary() }]}>
              Productivity
            </Text>
          </View>
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton onPress={() => router.back()} top={backButtonTop} left={Paddings.screen} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.paddedHorizontal}>
          <View style={styles.contentSection}>
            <GroupedList
              backgroundColor={themeColors.background.primary()}
              borderRadius={24}
              separatorVariant="solid"
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorConsiderIconColumn
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="goals"
                iconComponent={
                  <SFSymbolIcon
                    name="target"
                    size={18}
                    color={iconColor}
                    fallback={<SparklesIcon size={18} color={iconColor} />}
                  />
                }
                label="Goals"
                value=""
                onPress={() => router.push('/(tabs)/browse/goals' as any)}
                showChevron
              />
              <FormDetailButton
                key="achievements"
                iconComponent={
                  <SFSymbolIcon
                    name="trophy.fill"
                    size={18}
                    color={iconColor}
                    fallback={<SparklesIcon size={18} color={iconColor} />}
                  />
                }
                label="Achievements"
                value=""
                onPress={() => router.push('/(tabs)/browse/achievements' as any)}
                showChevron
              />
              <FormDetailButton
                key="completed"
                iconComponent={
                  <SFSymbolIcon
                    name="checkmark.circle"
                    size={18}
                    color={iconColor}
                    fallback={<SparklesIcon size={18} color={iconColor} />}
                  />
                }
                label="Completed"
                value=""
                onPress={() => router.push('/(tabs)/browse/completed' as any)}
                showChevron
              />
            </GroupedList>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    screen: { flex: 1 },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    topSectionTitleWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 56,
    },
    topSectionTitle: {
      ...typography.getTextStyle('heading-3'),
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      flexGrow: 1,
      gap: Paddings.formDataPillRowGap,
      paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
    },
    paddedHorizontal: {
      paddingHorizontal: Paddings.screen,
      gap: Paddings.formDataPillRowGap,
    },
    contentSection: {
      marginTop: Paddings.sectionCompact,
      marginBottom: Paddings.sectionCompact,
    },
    bottomSpacer: {
      height: 200,
    },
  });
