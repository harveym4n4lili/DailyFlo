/**
 * SFSymbolIcon – SF Symbols on iOS, fallback on Android/Web.
 * Uses expo-symbols SymbolView on iOS; renders fallback (custom icon) elsewhere.
 * Keeps icon size consistent (18) for GroupedList / FormDetailButton.
 */

import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

export type SFSymbolIconProps = {
  /** SF Symbol name (e.g. "calendar", "clock", "bell.fill") */
  name: string;
  /** Icon size in pt (default 18 to match FormDetailButton) */
  size?: number;
  /** Tint color for the symbol */
  color: string;
  /** Fallback to render on Android/Web where SF Symbols are not available */
  fallback: React.ReactNode;
  /** Optional style for the icon container (e.g. marginRight) */
  style?: ViewStyle;
};

export function SFSymbolIcon({
  name,
  size = 18,
  color,
  fallback,
  style,
}: SFSymbolIconProps) {
  if (Platform.OS !== 'ios') {
    return <>{fallback}</>;
  }
  return (
    <SymbolView
      name={name as any}
      size={size}
      tintColor={color}
      type="monochrome"
      fallback={fallback}
      style={[{ width: size, height: size }, style]}
    />
  );
}
