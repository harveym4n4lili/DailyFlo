/**
 * dashed rounded-rect outline — RN views don't support dashed borders on corners reliably,
 * so we draw an SVG rect with strokeDasharray (same dash rhythm as DashedSeparator).
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH } from '@/components/features/ai/chatComposerUiTokens';

export type DashedRoundedBorderProps = {
  width: number;
  height: number;
  radius: number;
  color: string;
  strokeWidth?: number;
  dashLength?: number;
  gapLength?: number;
  style?: ViewStyle;
};

export function DashedRoundedBorder({
  width,
  height,
  radius,
  color,
  strokeWidth = CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH,
  dashLength = 4,
  gapLength = 4,
  style,
}: DashedRoundedBorderProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const inset = strokeWidth / 2;
  const rectWidth = Math.max(0, width - strokeWidth);
  const rectHeight = Math.max(0, height - strokeWidth);
  const rectRadius = Math.max(0, radius - inset);

  return (
    <View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect
          x={inset}
          y={inset}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          ry={rectRadius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dashLength} ${gapLength}`}
        />
      </Svg>
    </View>
  );
}
