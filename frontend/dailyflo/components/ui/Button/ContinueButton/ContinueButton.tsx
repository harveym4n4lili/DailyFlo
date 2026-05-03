/**
 * ContinueButton — 48×48 circular CTA with liquid glass on iOS (expo-glass-effect)
 * and solid primary-button fill elsewhere. Icon: forward chevron.
 *
 * Default `layout="absolute"`: pins bottom-right using Paddings.screen + safe-area so you can
 * drop the component into any full-screen onboarding/step without a footer wrapper.
 * Parent should span the screen width (no horizontal padding on the same parent), or the `right`
 * offset will be measured inside that padding — use `layout="inline"` if you need custom placement.
 *
 * tint uses theme `primaryButton.fill` (PrimaryButtonColors in ColorPalette — app primary red).
 */

import React from 'react';
import { ActivityIndicator, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

const BUTTON_SIZE = 56;
const BORDER_RADIUS = BUTTON_SIZE / 2;

export interface ContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  /** when set, overrides theme `primaryButton.fill` (circle / glass tint) */
  fillColor?: string;
  /** when set, overrides theme `primaryButton.icon` (chevron + spinner) */
  iconColor?: string;
  /**
   * absolute — bottom-right using Paddings.screen + max(insets.bottom, Paddings.screen), minus liquidGlassBleed
   * so the visible glass circle lines up with screen padding (parent should be flex:1 full screen).
   * inline — no absolute frame; use in toolbars or custom rows.
   */
  layout?: 'absolute' | 'inline';
  /** merged outer wrapper; for absolute layout, applied after base positioning so you can tweak if needed */
  style?: StyleProp<ViewStyle>;
}

function getIOSMajor(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version as string | number;
  return typeof v === 'string' ? parseInt(v.split('.')[0], 10) : Math.floor(v as number);
}

export function ContinueButton({
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel = 'Continue',
  testID,
  layout = 'absolute',
  style,
  fillColor: fillColorProp,
  iconColor: iconColorProp,
}: ContinueButtonProps) {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isNewerIOS = getIOSMajor() >= 15;
  const glassAvailable = Platform.OS === 'ios';
  const bleed = Paddings.liquidGlassBleed;

  const fill = fillColorProp ?? themeColors.primaryButton.fill();
  const iconColor = iconColorProp ?? themeColors.primaryButton.icon();
  const inactive = disabled || loading;

  // glass blur draws outside the view bounds — do not clip on GlassView.
  const glassSurfaceStyle = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BORDER_RADIUS,
    overflow: 'visible' as const,
  };

  const solidSurfaceStyle = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden' as const,
  };

  const innerContent = loading ? (
    <ActivityIndicator color={iconColor} size="small" />
  ) : (
    <Ionicons name="chevron-forward" size={26} color={iconColor} />
  );

  const pressable = (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={{
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS,
        opacity: inactive ? 0.55 : 1,
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive }}
      testID={testID}
    >
      {innerContent}
    </Pressable>
  );

  // outer padding = bleed so native glass sits inside; subtract bleed from absolute offsets so the circle’s edge matches Paddings.screen from the screen.
  const haloWrapStyle = { overflow: 'visible' as const, padding: bleed };

  const circleGlass = (
    <View style={haloWrapStyle}>
      <GlassView style={glassSurfaceStyle} tintColor={fill as any} glassEffectStyle="regular" isInteractive>
        {pressable}
      </GlassView>
    </View>
  );

  const circleSolid = (
    <View style={haloWrapStyle}>
      <View style={[solidSurfaceStyle, { backgroundColor: fill }]}>{pressable}</View>
    </View>
  );

  const positionedShell = (child: React.ReactNode) => {
    if (layout !== 'absolute') {
      return <View style={[{ overflow: 'visible' as const }, style]}>{child}</View>;
    }
    const bottomOffset = Math.max(insets.bottom, Paddings.screenLarge) + bleed;
    const rightOffset = Paddings.screen + bleed;
    return (
      <View
        style={[
          {
            position: 'absolute' as const,
            right: rightOffset,
            bottom: bottomOffset,
            overflow: 'visible' as const,
            zIndex: 10,
          },
          style,
        ]}
      >
        {child}
      </View>
    );
  };

  if (isNewerIOS && glassAvailable) {
    return positionedShell(circleGlass);
  }

  return positionedShell(circleSolid);
}

export default ContinueButton;
