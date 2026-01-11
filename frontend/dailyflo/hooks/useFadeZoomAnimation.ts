/**
 * useFadeZoomAnimation Hook
 * 
 * Custom hook for managing fade-in and scale (zoom) animations.
 * Handles single element animations, sequential animations, and conditional animations.
 * 
 * This hook provides a reusable way to create consistent fade-in zoom animations
 * across the app, eliminating duplicated animation code.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Configuration options for fade zoom animation
 */
export interface UseFadeZoomAnimationOptions {
  // whether animation is enabled (if false, elements appear immediately)
  enabled?: boolean;
  // initial opacity value (usually 0 for fade-in)
  initialOpacity?: number;
  // target opacity value (usually 1 for full visibility)
  targetOpacity?: number;
  // initial scale value (usually 0.8 for zoom effect, 0.95 for subtle effect)
  initialScale?: number;
  // target scale value (usually 1 for full size)
  targetScale?: number;
  // animation duration in milliseconds (default: 400)
  duration?: number;
  // delay before animation starts in milliseconds (default: 0)
  delay?: number;
  // easing function for animation (default: Easing.out(Easing.ease))
  easing?: (value: number) => number;
  // whether to use native driver for better performance (default: true)
  useNativeDriver?: boolean;
  // optional existing opacity animated value (if not provided, creates new one)
  opacityValue?: Animated.Value;
  // optional existing scale animated value (if not provided, creates new one)
  scaleValue?: Animated.Value;
  // optional dependency array to trigger animation when values change
  // if not provided, animation runs once on mount
  dependencies?: React.DependencyList;
}

/**
 * Return type for useFadeZoomAnimation hook
 */
export interface UseFadeZoomAnimationReturn {
  // animated opacity value (use in style: { opacity: opacityValue })
  opacityValue: Animated.Value;
  // animated scale value (use in style: { transform: [{ scale: scaleValue }] })
  scaleValue: Animated.Value;
}

/**
 * Custom hook for managing fade-in zoom animations
 * 
 * @param options - Configuration options for the animation
 * @returns Object containing opacity and scale animated values
 * 
 * @example
 * // Basic usage - animate on mount
 * const { opacityValue, scaleValue } = useFadeZoomAnimation();
 * 
 * @example
 * // With custom configuration
 * const { opacityValue, scaleValue } = useFadeZoomAnimation({
 *   initialScale: 0.8,
 *   duration: 400,
 *   delay: 200,
 * });
 * 
 * @example
 * // Conditional animation
 * const { opacityValue, scaleValue } = useFadeZoomAnimation({
 *   enabled: isVisible,
 *   dependencies: [isVisible],
 * });
 * 
 * @example
 * // Using existing animated values
 * const existingOpacity = useRef(new Animated.Value(0)).current;
 * const existingScale = useRef(new Animated.Value(0.8)).current;
 * const { opacityValue, scaleValue } = useFadeZoomAnimation({
 *   opacityValue: existingOpacity,
 *   scaleValue: existingScale,
 *   dependencies: [someState],
 * });
 */
export function useFadeZoomAnimation(
  options: UseFadeZoomAnimationOptions = {}
): UseFadeZoomAnimationReturn {
  const {
    enabled = true,
    initialOpacity = 0,
    targetOpacity = 1,
    initialScale = 0.8,
    targetScale = 1,
    duration = 400,
    delay = 0,
    easing = Easing.out(Easing.ease),
    useNativeDriver = true,
    opacityValue: providedOpacityValue,
    scaleValue: providedScaleValue,
    dependencies = [],
  } = options;

  // create animated values if not provided, otherwise use provided values
  // use ref to ensure values persist across re-renders
  const internalOpacityValue = useRef<Animated.Value>(
    providedOpacityValue || new Animated.Value(enabled ? initialOpacity : targetOpacity)
  );
  const internalScaleValue = useRef<Animated.Value>(
    providedScaleValue || new Animated.Value(enabled ? initialScale : targetScale)
  );

  // use provided values if available, otherwise use internal values
  const opacityValue = providedOpacityValue || internalOpacityValue.current;
  const scaleValue = providedScaleValue || internalScaleValue.current;

  // animate when enabled changes or dependencies change
  useEffect(() => {
    if (!enabled) {
      // if animation is disabled, set values immediately to target
      opacityValue.setValue(targetOpacity);
      scaleValue.setValue(targetScale);
      return;
    }

    // reset values to initial state before animating
    opacityValue.setValue(initialOpacity);
    scaleValue.setValue(initialScale);

    // animate fade-in and scale simultaneously
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: targetOpacity,
        duration: duration,
        delay: delay,
        easing: easing,
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(scaleValue, {
        toValue: targetScale,
        duration: duration,
        delay: delay,
        easing: easing,
        useNativeDriver: useNativeDriver,
      }),
    ]).start();
    // include animated values in dependency array to match existing patterns
    // animated values are included to ensure effect runs when they change
    // dependencies array is included to trigger animation when dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies.length > 0 ? [enabled, opacityValue, scaleValue, ...dependencies] : [enabled, opacityValue, scaleValue]);

  return {
    opacityValue,
    scaleValue,
  };
}

