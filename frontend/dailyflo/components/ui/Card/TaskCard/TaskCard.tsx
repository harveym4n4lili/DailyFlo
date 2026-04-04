/**
 * TaskCard Component
 * 
 * This component displays an individual task in a card format.
 * It orchestrates smaller sub-components to display task information and handle interactions.
 * 
 * This component demonstrates the composition pattern - it composes smaller components
 * (TaskCardContent, TaskMetadata, TaskIndicators, etc.) into a complete task card.
 * 
 * This component demonstrates the flow from Redux store → Component → User interaction.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import * as Haptics from 'expo-haptics';

// TYPES FOLDER IMPORTS - TypeScript type definitions
import { Task } from '@/types';

// import color palette system for consistent theming
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

// import utility functions for task formatting and colors
import { getTaskColorValue } from '@/utils/taskColors';

// import task card sub-components
import TaskCardContent from './TaskCardContent';
import TaskCardListRecurrenceRow from './TaskCardListRecurrenceRow';
import TaskMetadata from './TaskMetadata';
import TaskIndicators from './TaskIndicators';
import TaskIcon from './TaskIcon';
import TaskCardCheckbox from './TaskCardCheckbox';

import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/button';

// import border components
import { DashedSeparator, SolidSeparator } from '@/components/ui/borders';
import { taskDisplayEquals } from '@/utils/taskDisplayEquals';

/**
 * Props interface for TaskCard component
 * 
 * This defines what data the component needs to display a task
 * and what functions it can call when the user interacts with it.
 */
export interface TaskCardProps {
  // task data to display
  task: Task;

  // callback functions for user interactions
  onPress?: (task: Task) => void; // called when user taps the card
  onComplete?: (task: Task, targetCompleted?: boolean) => void; // targetCompleted = explicit target when provided (for debounced rapid taps)
  onCompleteImmediate?: (task: Task, targetCompleted?: boolean) => void; // called immediately on tap (e.g. for local UI); backend sync still delayed
  onEdit?: (task: Task) => void; // called when user wants to edit task
  onDelete?: (task: Task) => void; // called when user wants to delete task

  // optional display options
  showCategory?: boolean; // whether to show the list/category name
  compact?: boolean; // whether to use compact layout
  showIcon?: boolean; // whether to show the task icon on the left (default true)
  showIndicators?: boolean; // whether to show bottom-right list/routine indicators (default true)
  showMetadata?: boolean; // whether to show date/time/duration metadata (default true)
  metadataVariant?: 'default' | 'today'; // 'today' = no date text, time as "09:00 - 09:30"
  cardSpacing?: number; // spacing between cards (default 20)
  showDashedSeparator?: boolean; // whether to show a dashed separator below the card (default false)
  /** dashed vs solid line when showDashedSeparator is true (browse/today use solid) */
  taskRowSeparatorVariant?: 'dashed' | 'solid';
  separatorPaddingHorizontal?: number; // horizontal padding for separator to match list padding (default 0)
  hideBackground?: boolean; // whether to hide the card background (default false)
  removeInnerPadding?: boolean; // whether to remove horizontal padding inside the card (default false)
  /** rounded container + ios liquid glass (android uses elevated + border) */
  liquidGlass?: boolean;
  isLastItem?: boolean; // whether this is the last item in the list (default false)
  isFirstItem?: boolean; // whether this is the first item in the list (default false)
  /** when set, replaces the title-row time range on the right (e.g. list name in browse search) */
  titleRightLabel?: string;
  /** when titleRightLabel is set: show leaf icon in tertiary (matches list search rows) */
  titleRightShowLeaf?: boolean;
  /** today screen: second row under title/time — leaf + list name (left), recurrence (right) */
  showListRecurrenceRow?: boolean;

  // selection mode - when true, card shows selection checkbox and tap toggles selection
  // parent (ListCard or TimelineItem) passes these from Redux selection state; TaskCard is presentational
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (task: Task, selected: boolean) => void;
}

/**
 * TaskCard Component
 * 
 * This is a presentational component that receives task data as props
 * and displays it in a styled card format. It doesn't directly interact
 * with Redux - instead, it calls callback functions that are passed down
 * from parent components that do handle Redux state.
 * 
 * This component uses composition to build the task card from smaller components:
 * - SwipeableCard: Adds swipe gesture functionality
 * - TaskCardContent: Displays icon and title
 * - TaskMetadata: Displays date/time/duration
 * - TaskIndicators: Displays routine type and list/inbox status
 * - Checkbox: Displays completion status checkbox on the left
 */
function taskCardPropsAreEqual(prev: TaskCardProps, next: TaskCardProps) {
  // compare task by value - when task 1's backend completes, task 2 gets new ref but same content; skip re-render
  if (!taskDisplayEquals(prev.task, next.task)) return false;
  return (
    prev.onPress === next.onPress &&
    prev.onComplete === next.onComplete &&
    prev.onCompleteImmediate === next.onCompleteImmediate &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.showCategory === next.showCategory &&
    prev.compact === next.compact &&
    prev.showIcon === next.showIcon &&
    prev.showIndicators === next.showIndicators &&
    prev.showMetadata === next.showMetadata &&
    prev.metadataVariant === next.metadataVariant &&
    prev.cardSpacing === next.cardSpacing &&
    prev.showDashedSeparator === next.showDashedSeparator &&
    prev.taskRowSeparatorVariant === next.taskRowSeparatorVariant &&
    prev.separatorPaddingHorizontal === next.separatorPaddingHorizontal &&
    prev.hideBackground === next.hideBackground &&
    prev.removeInnerPadding === next.removeInnerPadding &&
    prev.liquidGlass === next.liquidGlass &&
    prev.isLastItem === next.isLastItem &&
    prev.isFirstItem === next.isFirstItem &&
    prev.titleRightLabel === next.titleRightLabel &&
    prev.titleRightShowLeaf === next.titleRightShowLeaf &&
    prev.showListRecurrenceRow === next.showListRecurrenceRow &&
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.onSelect === next.onSelect
  );
}

const TaskCard = React.memo<TaskCardProps>(function TaskCard({
  task,
  onPress,
  onComplete,
  onCompleteImmediate,
  onEdit,
  onDelete,
  showCategory = false,
  compact = false,
  showIcon = true,
  showIndicators = true,
  showMetadata = true,
  metadataVariant = 'default',
  cardSpacing = 20,
  showDashedSeparator = false,
  taskRowSeparatorVariant = 'solid',
  separatorPaddingHorizontal = 0,
  hideBackground = false,
  removeInnerPadding = false,
  liquidGlass = false,
  isLastItem = false,
  isFirstItem = false,
  titleRightLabel,
  titleRightShowLeaf = false,
  showListRecurrenceRow = false,
  selectionMode = false,
  isSelected = false,
  onSelect,
}: TaskCardProps) {
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();

  // get task color value from color palette system
  const taskColor = useMemo(() => getTaskColorValue(task.color), [task.color]);

  // create dynamic styles using the color palette system
  const styles = useMemo(
    () => createStyles(themeColors, cardSpacing, liquidGlass),
    [themeColors, cardSpacing, liquidGlass],
  );
  const glassTint =
    Platform.OS === 'ios'
      ? (themeColors.background.primarySecondaryBlend() as string)
      : undefined;

  // displayCompleted from TaskCardCheckbox for card styling (optimistic ui)
  const [displayCompleted, setDisplayCompleted] = useState(task.isCompleted);
  useEffect(() => {
    setDisplayCompleted(task.isCompleted);
  }, [task.id]);

  // measured height of first title line (onTextLayout) — checkbox column uses same height + justify center so checkbox matches that line only (not the sub-row below)
  const [titleFirstLineHeight, setTitleFirstLineHeight] = useState<number | null>(null);
  useEffect(() => {
    setTitleFirstLineHeight(null);
  }, [task.id, task.title]);
  const handleTitleFirstLineHeight = useCallback((h: number) => {
    setTitleFirstLineHeight(h);
  }, []);

  // in selection mode: tap toggles selection; otherwise tap opens task
  const handlePress = () => {
    if (selectionMode && onSelect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(task, !isSelected);
    } else if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      onPress(task);
    }
  };

  const cardSurfaceStyle = [
    styles.card,
    compact && styles.compactCard,
    liquidGlass && styles.cardLiquidGlass,
    displayCompleted && !liquidGlass && styles.completedCard,
    displayCompleted && liquidGlass && styles.completedCardGlass,
    hideBackground && !liquidGlass && styles.transparentBackground,
    removeInnerPadding && styles.noInnerPadding,
  ];

  const cardBody = (
    <View style={cardSurfaceStyle}>
          <View style={styles.contentRow}>
            {/* slot height = first line of title (from TaskCardContent onTextLayout) — centers checkbox on that line, not the whole card column */}
            <View
              style={[
                styles.checkboxFirstLineSlot,
                titleFirstLineHeight != null ? { height: titleFirstLineHeight } : null,
              ]}
            >
              <TaskCardCheckbox
                task={task}
                onComplete={onComplete}
                onCompleteImmediate={onCompleteImmediate}
                onDisplayChange={setDisplayCompleted}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onSelect={selectionMode && onSelect ? () => onSelect(task, !isSelected) : undefined}
              />
            </View>

            {/* rest of card - touchable, opens task or toggles selection */}
            <TouchableOpacity
              style={styles.cardContentTouchable}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              {showIcon && task.icon && (
                <View style={styles.iconWrapper}>
                  <TaskIcon icon={task.icon} color={taskColor} />
                </View>
              )}

              <View style={styles.contentColumn}>
                {/* main content area - title */}
                <TaskCardContent
                  task={{ ...task, isCompleted: displayCompleted }}
                  taskColor={taskColor}
                  compact={compact}
                  titleRightLabel={titleRightLabel}
                  titleRightShowLeaf={titleRightShowLeaf}
                  onFirstLineHeightChange={handleTitleFirstLineHeight}
                />

                {showListRecurrenceRow && (
                  <TaskCardListRecurrenceRow task={task} isCompleted={displayCompleted} />
                )}

              {/* task metadata - date, time, duration (hidden when showMetadata is false) */}
              {showMetadata && (
                <TaskMetadata
                  dueDate={task.dueDate}
                  time={task.time}
                  duration={task.duration}
                  isCompleted={displayCompleted}
                  showCategory={showCategory}
                  listId={task.listId}
                  metadataVariant={metadataVariant}
                />
              )}
              </View>
            </TouchableOpacity>
          </View>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      {liquidGlass && Platform.OS === 'ios' ? (
        <GlassView
          style={[styles.glassShell, displayCompleted && styles.glassShellCompleted]}
          glassEffectStyle="clear"
          tintColor={glassTint as any}
          isInteractive
        >
          {cardBody}
        </GlassView>
      ) : (
        cardBody
      )}

        {/* row separator below card — aligned with title row (checkbox + gap + optional icon); solid or dashed from list preset */}
        {showDashedSeparator && !isLastItem && (
          taskRowSeparatorVariant === 'solid' ? (
            <SolidSeparator
              paddingLeft={
                CHECKBOX_SIZE_DEFAULT + 12 + (showIcon && task.icon ? 24 + 16 : 0)
              }
              // solid line runs to the row’s right edge; dashed still insets to match list padding
              paddingRight={0}
            />
          ) : (
            <DashedSeparator
              paddingLeft={
                CHECKBOX_SIZE_DEFAULT + 12 + (showIcon && task.icon ? 24 + 16 : 0)
              }
              paddingRight={separatorPaddingHorizontal}
            />
          )
        )}

        {/* bottom indicators - routine type and list/inbox status (hidden when showIndicators is false) */}
        {showIndicators && (
          <TaskIndicators routineType={task.routineType} listId={task.listId} />
        )}
    </View>
  );
}, taskCardPropsAreEqual);

// create dynamic styles using the color palette system
const LIQUID_GLASS_RADIUS = 16;

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  cardSpacing: number,
  liquidGlass: boolean
) => {
  const styles = StyleSheet.create({
    // card container with margin bottom for spacing
    cardContainer: {
      width: '100%', // ensure full width
      marginBottom: cardSpacing, // spacing between cards (configurable via prop)
      position: 'relative', // needed for absolute positioning
      alignItems: 'stretch', // ensure children take full width
    },

    // main card container
    card: {
      width: '100%', // ensure full width
      backgroundColor: themeColors.background.elevated(), // use theme-aware elevated background
      borderRadius: liquidGlass && Platform.OS !== 'ios' ? LIQUID_GLASS_RADIUS : 0,
      padding: Paddings.card,
      paddingRight: Paddings.taskCardRightPadding,
      position: 'relative', // needed for absolute positioning of completion indicator and bottom indicators
      overflow: liquidGlass ? 'hidden' : 'visible',
    },

    // ios: inner content sits inside GlassView — keep fill transparent so glass shows through
    cardLiquidGlass: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      ...(Platform.OS === 'android' && {
        backgroundColor: themeColors.background.elevated(),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: themeColors.border.secondary(),
      }),
    },

    glassShell: {
      borderRadius: LIQUID_GLASS_RADIUS,
      overflow: 'hidden',
      width: '100%',
    },

    glassShellCompleted: {
      opacity: 0.86,
    },

    completedCardGlass: {
      // completed state on ios uses glassShellCompleted opacity; android uses tint below
      ...(Platform.OS === 'android' && {
        backgroundColor: themeColors.background.tertiary(),
        opacity: 0.92,
      }),
    },

    // row container for checkbox, icon and content — alignItems start so checkbox slot height matches first title line only
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    // vertical center of checkbox within measured first-line band
    checkboxFirstLineSlot: {
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },

    // touchable area for icon + content - opens task (checkbox has separate touch)
    cardContentTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    // icon wrapper - provides spacing for icon
    iconWrapper: {
      marginRight: 16, // spacing between icon and content
    },

    // content column - contains title and metadata
    contentColumn: {
      flex: 1, // take remaining space
      flexDirection: 'column', // vertical layout for title and metadata
      justifyContent: 'center', // vertically center content within the column
    },

    // compact version for smaller displays
    compactCard: {
      padding: Paddings.cardCompact,
      paddingRight: Paddings.taskCardRightPaddingCompact,
      marginBottom: 8,
    },

    // completed task styling
    completedCard: {
      backgroundColor: themeColors.background.primary(), // use primary background color (same as today screen)
    },

    // transparent background styling (when hideBackground is true)
    transparentBackground: {
      backgroundColor: 'transparent', // transparent background to hide card background
    },

    // no inner padding styling (when removeInnerPadding is true)
    noInnerPadding: {
      paddingHorizontal: Paddings.none,
      paddingLeft: Paddings.none,
      paddingRight: Paddings.none,
      paddingTop: Paddings.card,
      paddingBottom: Paddings.card,
    },

    // selection checkbox wrapper - matches TaskCardCheckbox layout for alignment
    selectionCheckboxWrapper: {
      width: CHECKBOX_SIZE_DEFAULT,
      height: CHECKBOX_SIZE_DEFAULT,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      zIndex: 1,
    },
  });

  return styles;
};

export default TaskCard;
