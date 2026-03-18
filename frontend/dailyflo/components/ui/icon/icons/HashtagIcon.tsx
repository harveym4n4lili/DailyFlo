/**
 * HashtagIcon – hashtag (#) icon for lists/categories.
 * Used in Browse screen for list items.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type HashtagIconProps = {
  size?: number;
  color?: string;
};

export function HashtagIcon({ size = 24, color = '#000' }: HashtagIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9h16M4 15h16M10 3L8 21m8-18l-2 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
