/**
 * DragOverlay Component
 * 
 * Renders a visual overlay that follows the user's thumb during drag operations.
 * The overlay is a copy of the dragged task card that moves with the gesture,
 * while the actual task card stays in place with a visual indicator.
 * 
 * This component is used by TimelineView to show the drag preview.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, { useAnimatedStyle, useSharedValue, withSpring, SharedValue } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { Task } from '@/types';
import { getTaskColorValue } from '@/utils/taskColors';
import TaskIcon from '@/components/ui/Card/TaskCard/TaskIcon';
import { Checkbox, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { formatTimeRange, getTaskCardHeight } from './timelineUtils';
import {
  TIMELINE_RAIL_WIDTH,
  TIMELINE_RAIL_MARGIN_LEFT,
  TIMELINE_CONTENT_GAP,
} from './timelineChrome';

/** how far in from top/bottom the column reaches full opacity (larger = longer, softer fade) */
const DRAG_COLUMN_EDGE_FADE = 0.4;

/** extra height so the gradient can bleed past the row and soften vertical cutoffs */
const DRAG_COLUMN_FADE_BLEED = 20;

interface DragOverlayProps {
  task: Task;
  yPosition: number;
  cardHeight: number;
  duration: number;
  animatedPosition?: SharedValue<number>;
}

/** drag-only: column fill fades to transparent at top and bottom edges */
function DragOverlayColumnFade({
  fadeColors,
  fadeLocations,
  style,
  foregroundStyle,
  children,
}: {
  fadeColors: readonly string[];
  fadeLocations: readonly number[];
  style: object;
  foregroundStyle?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[dragFadeStyles.columnShell, style]}>
      <LinearGradient
        colors={[...fadeColors]}
        locations={[...fadeLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[dragFadeStyles.columnForeground, foregroundStyle]}>{children}</View>
    </View>
  );
}

const dragFadeStyles = StyleSheet.create({
  columnShell: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  columnForeground: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  contentForeground: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default function DragOverlay({
  task,
  yPosition,
  cardHeight,
  duration,
  animatedPosition,
}: DragOverlayProps) {
  if (!task) {
    return null;
  }

  const themeColors = useThemeColors();
  const typography = useTypography();
  const taskColor = getTaskColorValue(task.color);
  const styles = createStyles(themeColors, typography, taskColor);

  const minCardHeight = getTaskCardHeight(duration);
  const timeRangeText = task.time ? formatTimeRange(task.time, duration) : '';

  // multi-stop vertical fade — longer, smoother than a single edge band
  const columnFade = useMemo(() => {
    const primary = themeColors.background.primary();
    const clear = themeColors.withOpacity(primary, 0);
    const soft = themeColors.withOpacity(primary, 0.35);
    const e = DRAG_COLUMN_EDGE_FADE;
    return {
      colors: [clear, soft, primary, primary, soft, clear] as const,
      locations: [0, e * 0.35, e, 1 - e, 1 - e * 0.35, 1] as const,
    };
  }, [themeColors]);

  const internalOverlayY = useSharedValue(yPosition);
  const overlayY = animatedPosition || internalOverlayY;

  useEffect(() => {
    if (!animatedPosition) {
      internalOverlayY.value = yPosition;
    }
  }, []);

  useEffect(() => {
    if (!animatedPosition) {
      if (Platform.OS === 'ios') {
        internalOverlayY.value = withSpring(yPosition, {
          damping: 20,
          stiffness: 400,
          mass: 0.3,
          overshootClamping: false,
        });
      } else {
        internalOverlayY.value = yPosition;
      }
    }
  }, [yPosition, internalOverlayY, animatedPosition]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    top: overlayY.value,
  }));

  return (
    <AnimatedReanimated.View
      style={[
        styles.overlayContainer,
        styles.overlayContainerPadding,
        animatedOverlayStyle,
        { height: cardHeight },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.content, { height: cardHeight }]}>
        <View
          style={[
            styles.combinedContainer,
            {
              height: minCardHeight + DRAG_COLUMN_FADE_BLEED * 2,
              marginTop: -DRAG_COLUMN_FADE_BLEED,
            },
          ]}
        >
          <DragOverlayColumnFade
            fadeColors={columnFade.colors}
            fadeLocations={columnFade.locations}
            style={styles.timelineRail}
          >
            {task.icon ? (
              <TaskIcon icon={task.icon} color={taskColor} size={20} />
            ) : (
              <Checkbox checked={task.isCompleted} size={CHECKBOX_SIZE_DEFAULT} />
            )}
          </DragOverlayColumnFade>

          <DragOverlayColumnFade
            fadeColors={columnFade.colors}
            fadeLocations={columnFade.locations}
            style={[
              styles.contentSurface,
              styles.contentSurfacePadding,
              { height: minCardHeight + DRAG_COLUMN_FADE_BLEED * 2 },
            ]}
            foregroundStyle={dragFadeStyles.contentForeground}
          >
            <View style={styles.taskContent}>
              <View style={styles.textContainer}>
                <View style={styles.timeRangeRow}>
                  {timeRangeText ? (
                    <Text style={styles.timeRange}>{timeRangeText}</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.title,
                    task.isCompleted && styles.completedTitle,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {task.title}
                </Text>
              </View>
            </View>
            {task.icon ? (
              <View style={styles.checkboxWrapper}>
                <Checkbox checked={task.isCompleted} size={CHECKBOX_SIZE_DEFAULT} />
              </View>
            ) : null}
          </DragOverlayColumnFade>
        </View>
      </View>
    </AnimatedReanimated.View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  _taskColor: string
) =>
  StyleSheet.create({
    overlayContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'flex-start',
      zIndex: 2000,
    },

    content: {
      flex: 1,
      flexDirection: 'column',
      position: 'relative',
      overflow: 'visible',
    },

    combinedContainer: {
      flexDirection: 'row',
      width: '100%',
      alignItems: 'center',
      position: 'relative',
    },

    timelineRail: {
      width: TIMELINE_RAIL_WIDTH,
      marginLeft: TIMELINE_RAIL_MARGIN_LEFT,
      marginRight: TIMELINE_CONTENT_GAP,
      alignSelf: 'stretch',
    },

    contentSurface: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
    },

    checkboxWrapper: {
      width: CHECKBOX_SIZE_DEFAULT,
      height: CHECKBOX_SIZE_DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
    },

    taskContent: {
      flex: 1,
      position: 'relative',
      justifyContent: 'center',
    },

    timeRangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },

    textContainer: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'stretch',
    },

    completedTitle: {
      textDecorationLine: 'line-through',
      color: themeColors.text.secondary(),
    },

    overlayContainerPadding: {
      paddingLeft: Paddings.none,
      paddingRight: Paddings.card,
    },
    contentSurfacePadding: {
      paddingLeft: Paddings.none,
      paddingRight: Paddings.none,
      paddingVertical: Paddings.listItemVertical,
    },

    timeRange: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.tertiary(),
    },
    title: {
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    },
  });
