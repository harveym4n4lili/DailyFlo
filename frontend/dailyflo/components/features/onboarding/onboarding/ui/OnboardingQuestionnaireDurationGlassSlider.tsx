/**
 * onboarding “for how long?” — track bed uses `primarySecondaryBlend`; secondary pill-band matches thumb height/radius and is inset from the rail by the same px as top/bottom; labels + thumb stack above.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  ONBOARDING_DURATION_SLIDER_SNAP_SPRING,
  ONBOARDING_DURATION_SLIDER_THUMB_HEIGHT_PX,
  ONBOARDING_DURATION_SLIDER_THUMB_PADDING_HORIZONTAL_PX,
  ONBOARDING_DURATION_SLIDER_THUMB_WIDTH_PX,
  ONBOARDING_DURATION_SLIDER_TRACK_HEIGHT_PX,
} from '../constants/pagerLayout';
import {
  ONBOARDING_SLIDES_DURATION_PILL_TEXT_STYLE,
  ONBOARDING_SLIDES_DURATION_RAIL_TEXT_STYLE,
} from '../constants/typography';

/** onboarding preset stops — rail shows minutes plain + `h` for hours; pill adds `m` only for sub-hour picks */
const PRESETS: readonly { min: number; trackLabel: string; pillLabel: string }[] = [
  { min: 15, trackLabel: '15', pillLabel: '15m' },
  { min: 30, trackLabel: '30', pillLabel: '30m' },
  { min: 45, trackLabel: '45', pillLabel: '45m' },
  { min: 60, trackLabel: '1h', pillLabel: '1h' },
  { min: 120, trackLabel: '2h', pillLabel: '2h' },
  { min: 240, trackLabel: '4h', pillLabel: '4h' },
];

const TRACK_HEIGHT = ONBOARDING_DURATION_SLIDER_TRACK_HEIGHT_PX;
const THUMB_WIDTH = ONBOARDING_DURATION_SLIDER_THUMB_WIDTH_PX;
const THUMB_HEIGHT = ONBOARDING_DURATION_SLIDER_THUMB_HEIGHT_PX;
const THUMB_TOP = (TRACK_HEIGHT - THUMB_HEIGHT) / 2;
/** same inset left/right as above/below the shorter pill+trail band inside the taller track rail */
const TRACK_CONTENT_INSET_PX = THUMB_TOP;

const SNAP_SPRING = ONBOARDING_DURATION_SLIDER_SNAP_SPRING;

function indexForMinutes(minutes: number): number {
  const exact = PRESETS.findIndex((p) => p.min === minutes);
  if (exact >= 0) return exact;
  // e.g. old 90m session — snap to nearest stop
  return PRESETS.reduce((bestIdx, p, i) => {
    const dist = Math.abs(p.min - minutes);
    const bestDist = Math.abs(PRESETS[bestIdx].min - minutes);
    return dist < bestDist ? i : bestIdx;
  }, 0);
}

function pillLabelForMinutes(minutes: number): string {
  return PRESETS[indexForMinutes(minutes)]?.pillLabel ?? '30m';
}

export type OnboardingQuestionnaireDurationGlassSliderProps = {
  valueMinutes: number;
  onChange: (next: number) => void;
  /** solid fill — blended slide `continueButtonBackground` (same as green continue bar) */
  tintColor: string;
  /** duration text — blended `continueButtonIcon` */
  labelColor: string;
  accessibilityLabel?: string;
};

export function OnboardingQuestionnaireDurationGlassSlider({
  valueMinutes,
  onChange,
  tintColor,
  labelColor,
  accessibilityLabel = 'Task duration',
}: OnboardingQuestionnaireDurationGlassSliderProps) {
  const themeColors = useThemeColors();

  const draggingRef = useRef(false);
  const didInitPositionRef = useRef(false);
  const setDragging = useCallback((next: boolean) => {
    draggingRef.current = next;
  }, []);

  const [trackWidth, setTrackWidth] = useState(280);
  const sliderWidthSV = useSharedValue(280);
  const sliderPosition = useSharedValue(indexForMinutes(valueMinutes) / (PRESETS.length - 1));
  const startPosition = useSharedValue(0);

  const selectedPillLabel = useMemo(() => pillLabelForMinutes(valueMinutes), [valueMinutes]);

  // keeps the last duration we pushed to parent — haptic only when this changes (avoids buzzing on the same stop while dragging)
  const lastCommittedMinutesRef = useRef(valueMinutes);
  useEffect(() => {
    lastCommittedMinutesRef.current = valueMinutes;
  }, [valueMinutes]);

  const applyIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(PRESETS.length - 1, index));
      const nextMin = PRESETS[clamped].min;
      if (nextMin === lastCommittedMinutesRef.current) {
        return;
      }
      lastCommittedMinutesRef.current = nextMin;
      onChange(nextMin);
      // ios/android: light “tick” like a picker row; web has no haptics
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (draggingRef.current) return;
    const target = indexForMinutes(valueMinutes) / (PRESETS.length - 1);
    if (!didInitPositionRef.current) {
      didInitPositionRef.current = true;
      sliderPosition.value = target;
      return;
    }
    sliderPosition.value = withSpring(target, SNAP_SPRING);
  }, [valueMinutes, sliderPosition]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startPosition.value = sliderPosition.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      'worklet';
      const w = sliderWidthSV.value;
      const inset = TRACK_CONTENT_INSET_PX;
      const innerW = w - 2 * inset;
      const travel = Math.max(innerW - THUMB_WIDTH, 1);
      const next = Math.max(0, Math.min(1, startPosition.value + event.translationX / travel));
      sliderPosition.value = next;
      const nearest = Math.round(next * (PRESETS.length - 1));
      runOnJS(applyIndex)(nearest);
    })
    .onEnd(() => {
      'worklet';
      const idx = Math.round(sliderPosition.value * (PRESETS.length - 1));
      const target = idx / (PRESETS.length - 1);
      sliderPosition.value = withSpring(target, SNAP_SPRING);
      runOnJS(applyIndex)(idx);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(setDragging)(false);
    });

  const thumbStyle = useAnimatedStyle(() => {
    const w = sliderWidthSV.value;
    const inset = TRACK_CONTENT_INSET_PX;
    const innerW = w - 2 * inset;
    const travel = Math.max(innerW - THUMB_WIDTH, 0);
    return {
      left: inset + sliderPosition.value * travel,
    };
  });

  // secondary trail from the inset edge through the thumb — same horizontal breathing room as the vertical band gap
  const secondaryTrailBehindPillStyle = useAnimatedStyle(() => {
    const w = sliderWidthSV.value;
    const inset = TRACK_CONTENT_INSET_PX;
    const innerW = w - 2 * inset;
    const travel = Math.max(innerW - THUMB_WIDTH, 0);
    const filledW = sliderPosition.value * travel + THUMB_WIDTH;
    return {
      width: Math.min(innerW, filledW),
    };
  });

  const inTrackLabels = PRESETS.map((preset, index) => {
    const position = index / (PRESETS.length - 1);
    const innerW = Math.max(trackWidth - 2 * TRACK_CONTENT_INSET_PX, 0);
    const travel = Math.max(innerW - THUMB_WIDTH, 0);
    const centerX = TRACK_CONTENT_INSET_PX + THUMB_WIDTH / 2 + position * travel;
    const obscured = preset.min === valueMinutes;
    return (
      <View
        key={preset.min}
        style={[styles.inTrackLabelWrap, { left: centerX }]}
        pointerEvents="none"
      >
        <Text
          style={[
            ONBOARDING_SLIDES_DURATION_RAIL_TEXT_STYLE,
            styles.inTrackLabelText,
            {
              color: obscured
                ? themeColors.withOpacity(themeColors.text.secondary(), 0.25)
                : themeColors.text.secondary(),
              opacity: obscured ? 0.35 : 0.85,
            },
          ]}
          numberOfLines={1}
        >
          {preset.trackLabel}
        </Text>
      </View>
    );
  });

  const thumbBody = (
    <View style={[styles.thumbSolid, { backgroundColor: tintColor }]}>
      <Text
        style={[ONBOARDING_SLIDES_DURATION_PILL_TEXT_STYLE, styles.thumbLabelText, { color: labelColor }]}
        numberOfLines={1}
      >
        {selectedPillLabel}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.innerPad}>
        <GestureDetector gesture={pan}>
          <View
            style={styles.trackHitBox}
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
          >
            <View
              style={[
                styles.trackRail,
                { backgroundColor: themeColors.background.primarySecondaryBlend() },
              ]}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) {
                  setTrackWidth(w);
                  sliderWidthSV.value = w;
                }
              }}
            >
              <Animated.View
                style={[
                  styles.trackSecondaryTrailBehindPill,
                  { backgroundColor: themeColors.background.secondary() },
                  secondaryTrailBehindPillStyle,
                ]}
              />
              <View style={styles.trackLabelsLayer} pointerEvents="none">
                {inTrackLabels}
              </View>
              <Animated.View style={[styles.thumbAbsolute, thumbStyle]}>{thumbBody}</Animated.View>
            </View>
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  // vertical centering comes from parent (`taskWotaDurationLayer` `justifyContent: 'center'` + spinner band height); keep horizontal inset only
  innerPad: {
    paddingHorizontal: Paddings.touchTargetSmall,
    width: '100%',
  },
  trackHitBox: {
    width: '100%',
  },
  trackRail: {
    height: TRACK_HEIGHT,
    width: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  /** secondary strip matches thumb height + radius so the rail capsule lines up with the sliding pill */
  trackSecondaryTrailBehindPill: {
    position: 'absolute',
    left: TRACK_CONTENT_INSET_PX,
    top: THUMB_TOP,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_HEIGHT / 2,
    zIndex: 0,
  },
  trackLabelsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  inTrackLabelWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 40,
    marginLeft: -20,
    zIndex: 1,
  },
  inTrackLabelText: {
    textAlign: 'center',
    width: '100%',
  },
  thumbAbsolute: {
    position: 'absolute',
    top: THUMB_TOP,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    zIndex: 4,
  },
  thumbSolid: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ONBOARDING_DURATION_SLIDER_THUMB_PADDING_HORIZONTAL_PX,
    overflow: 'hidden',
  },
  thumbLabelText: {
    textAlign: 'center',
    flexShrink: 1,
  },
});
