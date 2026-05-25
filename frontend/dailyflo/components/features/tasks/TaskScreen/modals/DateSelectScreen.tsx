/**

 * Date select screen content. Used by app/date-select (root-level route).

 * Uses QuickDateOptions + CalendarView. Draft via CreateTaskDraftProvider.

 */



import React, { useCallback } from 'react';

import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainCloseButton } from '@/components/ui/Button';

import { useThemeColors } from '@/hooks/useColorPalette';

import { getTypographyStyle } from '@/constants/Typography';

import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

import { Paddings } from '@/constants/Paddings';

import { QuickDateOptions, CalendarView } from '@/components/features/calendar/sections';

import {

  ALERT_SHEET_CLOSE_TOP,

  ALERT_SHEET_HEADER_TRAILING_INSET,

  ALERT_SHEET_HORIZONTAL_INSET,

  ALERT_SHEET_SCROLL_PADDING_TOP,

} from './alertSheetChrome';



const SELECT_DATE_HEADING_GAP = Paddings.listItemVertical + Paddings.groupedListHeaderContentGap;



export function DateSelectScreen() {

  const typographyPlatform =

    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  const router = useGuardedRouter();

  const insets = useSafeAreaInsets();

  const themeColors = useThemeColors();

  const { draft, setDueDate } = useCreateTaskDraft();



  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();



  const selectedDate = draft.dueDate ?? new Date().toISOString();



  const handleClose = useCallback(() => {

    router.back();

  }, [router]);



  const handleQuickDateSelect = (date: string) => {

    setDueDate(date);

    router.back();

  };



  const handleCalendarDateSelect = (date: string) => {

    setDueDate(date);

  };



  return (

    <View style={[styles.container, { backgroundColor }]}>

      <ScrollView

        style={styles.scroll}

        contentContainerStyle={[

          styles.scrollContent,

          {

            paddingTop: ALERT_SHEET_SCROLL_PADDING_TOP,

            paddingBottom: insets.bottom + Paddings.modalBottomExtra,

            paddingHorizontal: ALERT_SHEET_HORIZONTAL_INSET,

          },

        ]}

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

      >

        <Text

          style={[

            getTypographyStyle('heading-3', typographyPlatform),

            styles.heading,

            {

              color: themeColors.text.primary(),

              paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,

            },

          ]}

          accessibilityRole="header"

          accessibilityLabel="Select Date"

        >

          Select Date

        </Text>



        <View style={styles.quickOptionsSection}>

          <QuickDateOptions

            selectedDate={selectedDate}

            onSelectDate={handleQuickDateSelect}

          />

        </View>



        <CalendarView

          selectedDate={selectedDate}

          onSelectDate={handleCalendarDateSelect}

          initialMonth={selectedDate ? new Date(selectedDate) : undefined}

          contentInsetHandledByParent

        />

      </ScrollView>



      <View style={styles.headerOverlay} pointerEvents="box-none">

        <MainCloseButton

          onPress={handleClose}

          top={ALERT_SHEET_CLOSE_TOP}

          right={ALERT_SHEET_HORIZONTAL_INSET}

          iconEmphasis="secondary"

        />

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1 },

  scroll: { flex: 1, minHeight: 0 },

  scrollContent: { flexGrow: 1 },

  heading: {

    marginBottom: SELECT_DATE_HEADING_GAP,

  },

  quickOptionsSection: {

    width: '100%',

    marginBottom: Paddings.screen,

  },

  headerOverlay: {

    position: 'absolute',

    top: 0,

    left: 0,

    right: 0,

    zIndex: 10,

  },

});


