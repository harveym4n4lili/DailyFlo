/**
 * EllipsisIcon – three horizontal dots (outline/stroke style).
 * used for context menu trigger in ActionContextMenu, ListCard, ScreenContextButton.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type EllipsisIconProps = {
  size?: number;
  color?: string;
};

export function EllipsisIcon({ size = 24, color = '#000' }: EllipsisIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 7"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        fillRule="evenodd"
        d="M3.5 0C5.433 0 7 1.567 7 3.5C7 5.433 5.433 7 3.5 7C1.567 7 0 5.433 0 3.5C0 1.567 1.567 0 3.5 0ZM12 0C13.933 0 15.5 1.567 15.5 3.5C15.5 5.433 13.933 7 12 7C10.067 7 8.5 5.433 8.5 3.5C8.5 1.567 10.067 0 12 0ZM20.5 0C22.433 0 24 1.567 24 3.5C24 5.433 22.433 7 20.5 7C18.567 7 17 5.433 17 3.5C17 1.567 18.567 0 20.5 0ZM20.5 1.5C19.3954 1.5 18.5 2.39543 18.5 3.5C18.5 4.60457 19.3954 5.5 20.5 5.5C21.6046 5.5 22.5 4.60457 22.5 3.5C22.5 2.39543 21.6046 1.5 20.5 1.5ZM3.5 1.5C2.39543 1.5 1.5 2.39543 1.5 3.5C1.5 4.60457 2.39543 5.5 3.5 5.5C4.60457 5.5 5.5 4.60457 5.5 3.5C5.5 2.39543 4.60457 1.5 3.5 1.5ZM12 1.5C10.8954 1.5 10 2.39543 10 3.5C10 4.60457 10.8954 5.5 12 5.5C13.1046 5.5 14 4.60457 14 3.5C14 2.39543 13.1046 1.5 12 1.5Z"
        fill={color}
      />
    </Svg>
  );
}
