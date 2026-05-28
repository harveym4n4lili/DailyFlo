/**
 * Animated mount/unmount wrapper for Display modal sections.
 * Uses the same spring layout + fade as ListCard task removal and Browse My Lists expand.
 */

import React from 'react';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';

export type DisplaySettingsAnimatedSectionProps = {
  children: React.ReactNode;
};

export function DisplaySettingsAnimatedSection({ children }: DisplaySettingsAnimatedSectionProps) {
  return (
    <Animated.View
      layout={LAYOUT_TRANSITION_SPRING}
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
    >
      {children}
    </Animated.View>
  );
}
