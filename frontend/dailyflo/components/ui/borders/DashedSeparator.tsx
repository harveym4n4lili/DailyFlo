/**
 * DashedSeparator Component
 * 
 * A reusable dashed line separator component that creates a dashed border
 * using multiple small Views. Since React Native doesn't support dashed borders
 * natively, we simulate it by rendering multiple small rectangles with gaps between them.
 * 
 * The number of dashes is calculated based on available width (screen width minus padding).
 * This component uses theme colors internally and accepts horizontal padding as a prop.
 * 
 * Usage:
 * ```tsx
 * <DashedSeparator paddingHorizontal={20} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';

interface DashedSeparatorProps {
  // horizontal padding on both left and right sides (default 0)
  // this padding matches the parent container's padding to align the separator properly
  paddingHorizontal?: number;
  // optional style override for the container (useful for adding marginTop, etc.)
  style?: ViewStyle;
}

/**
 * DashedSeparator Component
 * 
 * Renders a dashed line separator with configurable horizontal padding.
 * The dashes are calculated dynamically based on available screen width.
 */
export default function DashedSeparator({ 
  paddingHorizontal = 0,
  style,
}: DashedSeparatorProps) {
  // get theme colors internally so component is self-contained
  const themeColors = useThemeColors();

  // calculate number of dashes needed based on available width (screen width minus padding)
  // pattern: 8px dash + 4px gap = 12px per dash segment
  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - (paddingHorizontal * 2); // subtract left and right padding
  const dashWidth = 8;
  const gapWidth = 4;
  const segmentWidth = dashWidth + gapWidth;
  // calculate dash count to cover available width exactly (no extra dashes)
  const dashCount = Math.floor(availableWidth / segmentWidth);
  const dashes = Array.from({ length: dashCount }, (_, i) => i);

  // ensure padding values are exactly equal on both sides
  const paddingLeft = paddingHorizontal;
  const paddingRight = paddingHorizontal;

  return (
    <View style={[styles.container, { 
      paddingLeft,
      paddingRight,
    }, style]}>
      <View style={styles.dashContainer}>
        {dashes.map((index) => (
          <View
            key={index}
            style={[
              styles.dash,
              { backgroundColor: themeColors.border.primary() },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// styles for dashed separator component
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 0, // no top margin, sits right below card
    overflow: 'hidden', // prevent dashes from extending beyond padding
    // paddingLeft and paddingRight are applied dynamically via style prop to ensure equal spacing on both sides
  },
  dashContainer: {
    flexDirection: 'row', // horizontal layout for dashes
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap', // prevent wrapping
  },
  dash: {
    width: 8, // dash width
    height: 1, // dash height (1px line)
    marginRight: 4, // gap between dashes
  },
});
