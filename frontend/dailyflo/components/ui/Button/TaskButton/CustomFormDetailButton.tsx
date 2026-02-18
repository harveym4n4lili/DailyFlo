/**
 * CustomFormDetailButton Component
 * 
 * Custom button for form detail displays (time/duration, alerts, etc.).
 * Not a GroupedList button - a standalone custom button with elevated styling.
 * Used by FormDetailSection for time/alert displays.
 * 
 * Features:
 * - Icon on the left (custom ReactNode)
 * - Text content in the middle (main label + optional sub label)
 * - Optional chevron on the right
 * - Elevated background styling
 * - Pressable when onPress is provided
 * - Custom corner radius props for side-by-side layout styling
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { DashedSeparator } from '@/components/ui/borders';
import { Paddings } from '@/constants/Paddings';

// constants for consistent styling - groupedListContentVertical (14) matches GroupedList row padding
const ICON_SIZE = 18;
const DEFAULT_RADIUS = 28; // default border radius when not in side-by-side layout
const CONTENT_PADDING_HORIZONTAL = 16;

export interface CustomFormDetailButtonProps {
  /** Custom icon component (ReactNode) to display on the left */
  icon: React.ReactNode;
  
  /** Main label text */
  mainLabel: string;
  
  /** Optional sub label text displayed below main label */
  subLabel?: string;
  
  /** Whether to show chevron icon on the right (default: true) */
  showChevron?: boolean;
  
  /** Callback when button is pressed (makes button pressable) */
  onPress?: () => void;
  
  /** Whether main label should use bold font weight (default: false) */
  boldMainLabel?: boolean;
  
  /** Top-left corner radius (default: DEFAULT_RADIUS) */
  borderTopLeftRadius?: number;
  
  /** Top-right corner radius (default: DEFAULT_RADIUS) */
  borderTopRightRadius?: number;
  
  /** Bottom-left corner radius (default: DEFAULT_RADIUS) */
  borderBottomLeftRadius?: number;
  
  /** Bottom-right corner radius (default: DEFAULT_RADIUS) */
  borderBottomRightRadius?: number;
  
  /** Custom style override for wrapper */
  style?: ViewStyle;

  /** Whether to show a top separator border (default: false) */
  showTopSeparator?: boolean;

  /** Horizontal padding for the top separator to match container padding (default: 0) */
  separatorPaddingHorizontal?: number;
}

/**
 * CustomFormDetailButton Component
 * 
 * Displays a custom button with icon, main label, optional sub label, and optional chevron.
 * Can be pressable or static based on onPress prop.
 */
export const CustomFormDetailButton: React.FC<CustomFormDetailButtonProps> = ({
  icon,
  mainLabel,
  subLabel,
  showChevron = true,
  onPress,
  boldMainLabel = false,
  borderTopLeftRadius = DEFAULT_RADIUS,
  borderTopRightRadius = DEFAULT_RADIUS,
  borderBottomLeftRadius = DEFAULT_RADIUS,
  borderBottomRightRadius = DEFAULT_RADIUS,
  style,
  showTopSeparator = false,
  separatorPaddingHorizontal = 0,
}) => {
  const themeColors = useThemeColors();
  // hide background by setting to transparent
  const backgroundColor = 'transparent';

  // border radius style from props
  const borderRadiusStyle = {
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  };

  // content: icon + text labels + optional chevron
  const content = (
    <>
      {icon}
      <View style={styles.textWrap}>
        <Text
          style={[
            getTextStyle('body-large'), 
            { 
              color: themeColors.text.primary(),
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={boldMainLabel}
          minimumFontScale={boldMainLabel ? 0.7 : 1}
        >
          {mainLabel}
        </Text>
        {subLabel && (
          <Text
            style={[
              getTextStyle('body-medium'), 
              styles.subLabel, 
              { 
                color: themeColors.text.tertiary(), 
              }
            ]}
            numberOfLines={1}
          >
            {subLabel}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={themeColors.text.tertiary()} 
          style={styles.chevron} 
        />
      )}
    </>
  );

  // inner row container
  const inner = (
    <View style={styles.row}>
      {content}
    </View>
  );

  // wrapper style with background and border radius
  const wrapperStyle: ViewStyle[] = [
    styles.wrapper,
    { backgroundColor, ...borderRadiusStyle },
    style,
  ];

  // render as pressable if onPress is provided, otherwise static view
  const buttonContent = onPress != null ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...wrapperStyle, { opacity: pressed ? 0.7 : 1 }]}
    >
      {inner}
    </Pressable>
  ) : (
    <View style={wrapperStyle}>{inner}</View>
  );

  return (
    <View>
      {/* top separator - shown when showTopSeparator is true */}
      {showTopSeparator && (
        <DashedSeparator paddingHorizontal={separatorPaddingHorizontal} />
      )}
      {buttonContent}
    </View>
  );
};

const styles = StyleSheet.create({
  // outer wrapper: handles background, border radius, overflow
  wrapper: {
    overflow: 'hidden',
  },
  // inner row: horizontal layout with icon, text, chevron
  // horizontal padding removed as per design requirements
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.groupedListIconTextSpacing,
    paddingHorizontal: Paddings.none,
    paddingVertical: Paddings.groupedListContentVertical,
  },
  // text container: flex to fill available space
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  // spacing between main and sub label
  subLabel: {
    marginTop: 6,
  },
  // chevron icon spacing
  chevron: { 
    marginLeft: 8 
  },
});

// export constants for use in other components
export const CUSTOM_FORM_DETAIL_BUTTON_CONSTANTS = {
  ICON_SIZE,
  DEFAULT_RADIUS,
  INNER_RADIUS: 8, // inner radius for side-by-side layout
  OUTER_RADIUS: 28, // outer radius for side-by-side layout
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_VERTICAL: Paddings.groupedListContentVertical,
};

export default CustomFormDetailButton;
