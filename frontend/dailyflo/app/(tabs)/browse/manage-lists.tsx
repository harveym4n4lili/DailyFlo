/**
 * Manage Lists – full-screen modal on the browse stack (see browse/_layout: presentation modal).
 * No form-sheet snap points: fills the screen; dismiss with MainCloseButton like Browse Settings.
 * Content scrolls under the blur header overlay (same pattern as settings.tsx).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton } from '@/components/ui/button';
import { Paddings } from '@/constants/Paddings';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

export default function ManageListsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(typography);

  const topSectionHeight = TOP_SECTION_HEIGHT;
  const headerTitleStyle = {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_ROW_HEIGHT + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.bodyLead, { color: themeColors.text.secondary() }]}>
            Reorder and edit lists here (coming soon).
          </Text>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* fixed header: blur + gradient + centered title + close (matches browse settings) */}
      <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
        <View style={[styles.topSectionAnchor, { height: topSectionHeight }]}>
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              themeColors.background.primary(),
              themeColors.withOpacity(themeColors.background.primary(), 0),
            ]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        <View style={[styles.headerRow, { top: HEADER_TOP }]} pointerEvents="box-none">
          <View style={styles.headerPlaceholder} pointerEvents="none" />
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={headerTitleStyle}>Manage Lists</Text>
          </View>
          <View style={styles.headerPlaceholder} pointerEvents="none" />
        </View>
        <View style={styles.closeButtonContainer} pointerEvents="box-none">
          <MainCloseButton
            onPress={() => router.back()}
            top={Paddings.screen}
            left={Paddings.screen}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentArea: {
      flex: 1,
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
    },
    bodyLead: {
      ...typography.getTextStyle('body-large'),
      marginBottom: 16,
    },
    headerRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: HEADER_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
      zIndex: 10,
    },
    headerPlaceholder: {
      width: 44,
      height: 44,
    },
    headerCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: TOP_SECTION_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    bottomSpacer: {
      height: 200,
    },
  });
