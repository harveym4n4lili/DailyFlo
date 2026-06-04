/**
 * new-best streak medal — left→right gold gradient clipped to medal shape.
 * MaskedView uses the icon silhouette as a mask; Svg LinearGradient fills it underneath.
 */

import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbolIcon } from '@/components/ui/Icon';

export type ProgressBoardNewBestMedalIconProps = {
  size: number;
  /** [left lighter, right base gold] — from getProgressBoardNewBestMedalGradientColors() */
  gradientColors: readonly [string, string];
};

export function ProgressBoardNewBestMedalIcon({
  size,
  gradientColors,
}: ProgressBoardNewBestMedalIconProps) {
  const [leftColor, rightColor] = gradientColors;
  const gradientId = useId().replace(/:/g, '');

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={
        <View style={[styles.maskBox, { width: size, height: size }]}>
          <SFSymbolIcon
            name="medal.fill"
            size={size}
            color="#000"
            fallback={<Ionicons name="medal" size={size} color="#000" />}
          />
        </View>
      }
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={leftColor} />
            <Stop offset="100%" stopColor={rightColor} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
