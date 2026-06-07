/**
 * UpDownArrowSFSymbolIcon – SF Symbol on iOS, UpDownArrowIcon SVG elsewhere.
 * use for sort / up-down arrow affordances (e.g. display settings “Sorting” row).
 */

import React from 'react';
import { ViewStyle } from 'react-native';

import { SFSymbolIcon } from './SFSymbolIcon';
import { UpDownArrowIcon, UpDownArrowIconProps } from './icons/UpDownArrowIcon';

/** ios SF Symbol closest to our outline up/down sort SVG */
export const UP_DOWN_ARROW_SF_SYMBOL = 'arrow.up.arrow.down';

export type UpDownArrowSFSymbolIconProps = UpDownArrowIconProps & {
  style?: ViewStyle;
};

export function UpDownArrowSFSymbolIcon({
  size = 18,
  color = '#000',
  style,
}: UpDownArrowSFSymbolIconProps) {
  return (
    <SFSymbolIcon
      name={UP_DOWN_ARROW_SF_SYMBOL}
      size={size}
      color={color}
      style={style}
      fallback={<UpDownArrowIcon size={size} color={color} />}
    />
  );
}
