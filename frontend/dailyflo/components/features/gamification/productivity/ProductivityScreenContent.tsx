/**
 * productivity hub — links to goals, achievements, and completed activity (browse stack).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors, useBrandColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { SparklesIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';

export function ProductivityScreenContent() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { getMarpleBrandColor } = useBrandColors();
  const iconColor = getMarpleBrandColor(500);

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background.root() }]}>
      {Platform.OS === 'android' ? (
        <View style={[styles.androidHeader, { paddingTop: insets.top }]}>
          <MainBackButton />
          <Text style={[typography.getTextStyle('heading-3'), { color: themeColors.text.primary() }]}>
            Productivity
          </Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingTop: browseScrollPaddingTop(insets),
          paddingHorizontal: Paddings.screen,
          paddingBottom: Paddings.scrollBottomExtra + Paddings.sectionCompact,
        }}
      >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Paddings.screen,
    paddingBottom: Paddings.contentVertical,
    gap: Paddings.touchTargetSmall,
  },
});
