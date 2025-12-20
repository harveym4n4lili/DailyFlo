/**
 * Onboarding Navigation Component
 * 
 * This component provides a shared navigation header for all onboarding screens.
 * It includes:
 * - Back button (shown conditionally)
 * - Progress dots indicator (shows which step user is on)
 * 
 * The dots are animated and update automatically based on the current route.
 * The back button and dots are positioned in the same container to prevent layout shifts.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';

// define the onboarding screens in order (including completion screen)
const ONBOARDING_SCREENS = ['welcome', 'reminders', 'signup', 'completion'] as const;
const ALL_SCREENS = ['welcome', 'reminders', 'signup', 'completion'] as const;
type OnboardingScreen = typeof ONBOARDING_SCREENS[number];
type AllScreen = typeof ALL_SCREENS[number];

// dot dimensions
const DOT_INACTIVE_WIDTH = 8;
const DOT_ACTIVE_WIDTH = 24;
const DOT_HEIGHT = 8;

export function OnboardingNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  // determine current screen from route segments
  // segments will be like ["(onboarding)", "welcome"] or ["(onboarding)", "reminders"]
  const currentScreen = segments[segments.length - 1] as AllScreen;
  const currentStep = ONBOARDING_SCREENS.indexOf(currentScreen as OnboardingScreen);
  const activeStep = currentStep >= 0 ? currentStep : 0; // default to 0 if not found (step 0-3: welcome, reminders, signup, completion)
  
  // create animated values for each dot's width and opacity
  // these will animate smoothly when the active step changes
  const dotWidths = useRef(
    ONBOARDING_SCREENS.map(() => new Animated.Value(DOT_INACTIVE_WIDTH))
  ).current;
  const dotOpacities = useRef(
    ONBOARDING_SCREENS.map(() => new Animated.Value(0.3))
  ).current;
  
  // animated values for back button fade and slide in animation
  // opacity starts at 0 and translateX starts at -20 (slightly to the left)
  const backButtonOpacity = useRef(new Animated.Value(0)).current;
  const backButtonTranslateX = useRef(new Animated.Value(-20)).current;
  
  // track previous shouldShowBack state to detect when back button first appears
  const prevShouldShowBack = useRef(false);
  
  // determine if back button should be shown
  // hide on welcome screen (first screen) only
  const shouldShowBack = activeStep > 0;
  
  // show dots on all screens including completion
  const shouldShowDots = true;
  
  /**
   * Animate back button when it first appears
   * Fades in and slides in from the left when transitioning to reminders screen
   */
  useEffect(() => {
    // check if back button just became visible (transitioned from false to true)
    if (shouldShowBack && !prevShouldShowBack.current) {
      // animate back button: fade in and slide in from left
      Animated.parallel([
        Animated.timing(backButtonOpacity, {
          toValue: 1, // fully visible
          duration: 300, // animation duration
          easing: Easing.out(Easing.cubic), // smooth easing
          useNativeDriver: true, // opacity supports native driver
        }),
        Animated.timing(backButtonTranslateX, {
          toValue: 0, // final position (no offset)
          duration: 300, // same duration for synchronized animation
          easing: Easing.out(Easing.cubic), // smooth easing
          useNativeDriver: true, // transform supports native driver
        }),
      ]).start();
    } else if (!shouldShowBack && prevShouldShowBack.current) {
      // back button is being hidden, reset animation values
      backButtonOpacity.setValue(0);
      backButtonTranslateX.setValue(-20);
    }
    
    // update previous state for next render
    prevShouldShowBack.current = shouldShowBack;
  }, [shouldShowBack, backButtonOpacity, backButtonTranslateX]);
  
  /**
   * Animate dots when active step changes
   * This creates smooth transitions between dots as screens change
   */
  useEffect(() => {
    if (!shouldShowDots) return; // don't animate if dots are hidden
    
    // create combined animations for each dot (width and opacity)
    // we use useNativeDriver: false for both since width requires it
    // this avoids conflicts between native and non-native drivers
    const animations = ONBOARDING_SCREENS.map((_, index) => {
      const isActive = index === activeStep;
      const targetWidth = isActive ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH;
      const targetOpacity = isActive ? 1 : 0.3;
      
      // animate width and opacity together for each dot
      return Animated.parallel([
        Animated.timing(dotWidths[index], {
          toValue: targetWidth,
          duration: 300, // animation duration in milliseconds
          easing: Easing.out(Easing.cubic), // smooth easing curve
          useNativeDriver: false, // width animation doesn't support native driver
        }),
        Animated.timing(dotOpacities[index], {
          toValue: targetOpacity,
          duration: 300, // same duration for synchronized animation
          easing: Easing.out(Easing.cubic), // smooth easing curve
          useNativeDriver: false, // use false to match width animation and avoid conflicts
        }),
      ]);
    });
    
    // start all dot animations in parallel for synchronized transition
    Animated.parallel(animations).start();
  }, [activeStep, shouldShowDots, dotWidths, dotOpacities]);
  
  /**
   * Handle back button press
   * Navigates back to previous screen
   */
  const handleBack = () => {
    router.back();
  };
  
  const styles = createStyles(themeColors, insets);
  
  return (
    <View style={styles.container}>
      {/* Back Button */}
      {/* positioned absolutely on the left, only shown when not on first screen */}
      {/* fades in and slides in from the left when first appearing */}
      {shouldShowBack && (
        <Animated.View
          style={[
            styles.backButton,
            {
              opacity: backButtonOpacity,
              transform: [{ translateX: backButtonTranslateX }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backButtonTouchable}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.text.primary()} />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Navigation Dots Indicator */}
      {/* centered dots showing progress through onboarding */}
      {/* dots animate smoothly when transitioning between screens */}
      {shouldShowDots && (
        <View style={styles.dotsContainer}>
          {ONBOARDING_SCREENS.map((_, index) => {
            // determine if this dot is active
            const isActive = index === activeStep;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    // animated width - smoothly transitions between active and inactive sizes
                    width: dotWidths[index],
                    // animated opacity - smoothly transitions between active and inactive opacities
                    opacity: dotOpacities[index],
                    // background color: active dot uses full color, inactive uses semi-transparent
                    backgroundColor: themeColors.text.primary(),
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  container: {
    // absolute positioning at the top to prevent layout shifts
    position: 'absolute',
    top: insets.top + 20, // safe area top padding plus extra spacing
    left: 0,
    right: 0,
    height: 40, // fixed height for consistent positioning
    flexDirection: 'row', // horizontal layout for back button and dots
    alignItems: 'center', // vertically center items
    paddingHorizontal: 24, // horizontal padding
    zIndex: 10, // ensure it's above other content
  },
  backButton: {
    // position absolutely on the left so dots stay centered
    position: 'absolute',
    left: 24,
    width: 40, // touch target size
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dotsContainer: {
    // center the dots horizontally
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // spacing between dots
    flex: 1, // take up remaining space to center properly
  },
  dot: {
    // base dot style - width is animated, so we don't set it here
    height: DOT_HEIGHT, // fixed height
    borderRadius: DOT_HEIGHT / 2, // perfect circle (half of height)
    // backgroundColor and opacity are set dynamically in component
  },
});
