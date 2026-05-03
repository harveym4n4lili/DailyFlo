import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_300Light,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Platform, TextInput } from 'react-native';

// set default cursor/selection color app-wide; RN 0.83 types omit defaultProps but the merge still works at runtime
const TI = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
TI.defaultProps = { ...(TI.defaultProps || {}), selectionColor: '#FFFFFF', cursorColor: '#FFFFFF' };
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColors } from '@/hooks/useColorPalette';
import { ReduxProvider } from '@/store/Provider';
import { CustomTabNavMetricsProvider } from '@/contexts/CustomTabNavMetricsContext';
import { CreateTaskDraftProvider } from './task/CreateTaskDraftContext';
import { DuplicateTaskProvider } from './task/DuplicateTaskContext';
import { PlannerMonthSelectProvider } from './PlannerMonthSelectContext';
import { store } from '@/store';
import { logout, checkAuthStatus } from '@/store/slices/auth/authSlice';

// storage key for tracking onboarding completion status
// this key is used to check if the user has completed the onboarding flow
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useGuardedRouter();
  // theme background used when liquid glass is not available (android or older ios)
  const themeColors = useThemeColors();
  const tabBarBackgroundColor = themeColors.background.primary();
  // liquid glass: on iOS (not iPad) we let expo-glass-effect decide if glass is supported internally.
  // older SDKs may not export isGlassEffectAPIAvailable, so we avoid calling it directly.
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  
  // state to track if we're still checking onboarding status
  // this prevents showing the app before we know where to route the user
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // ref to track if we've already done the initial navigation check
  // this prevents the useEffect from running multiple times and causing flashing
  const hasNavigatedRef = useRef(false);
  
  // load all the fonts we need for the app
  // this tells expo-font to load the Inter font files (18pt optical size for UI)
  // each font gets a name that we can use in our typography system
  // load Inter fonts from @expo-google-fonts/inter (no local font files needed)
  const [loaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  /**
   * bootstrap navigation: land on today first, then stack-present onboarding when needed.
   *
   * flow:
   * 1. hydrate auth (tokens / user) via checkAuthStatus
   * 2. if intro not finished but redux says logged in, logout so first-run stays clean
   * 3. replace to today tab (main app is always underneath)
   * 4. if user is new (intro incomplete) or logged out, push onboarding as a root-stack modal
   *    so it slides up over today instead of replacing the whole app
   */
  useEffect(() => {
    // prevent multiple navigation checks - only do this once
    if (hasNavigatedRef.current || !loaded) {
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        hasNavigatedRef.current = true;

        // small delay so expo-router's stack mounts before we replace/push
        await new Promise((resolve) => setTimeout(resolve, 100));

        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

        await store.dispatch(checkAuthStatus());

        let authState = store.getState().auth;

        // first launch: don't keep a stale session while intro is still pending
        if (onboardingComplete !== 'true' && authState.isAuthenticated) {
          store.dispatch(logout());
          authState = store.getState().auth;
        }

        // today is the default tab; keep tabs mounted so onboarding is just a layer on top
        router.replace('/(tabs)/today');

        const needsOnboarding = onboardingComplete !== 'true' || !authState.isAuthenticated;
        if (needsOnboarding) {
          router.push('/(onboarding)/introductory');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);

        hasNavigatedRef.current = true;

        const authState = store.getState().auth;
        if (authState.isAuthenticated) {
          store.dispatch(logout());
        }

        router.replace('/(tabs)/today');
        router.push('/(onboarding)/introductory');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // wait for fonts to load before showing the app
  // this prevents text from showing with wrong fonts while loading
  // also wait for onboarding check to complete
  if (!loaded || isCheckingOnboarding) {
    // return null means don't show anything until fonts are ready and onboarding check is done
    // this only happens in development - in production fonts are bundled
    return null;
  }

  // custom theme matching app background – prevents white flash in corners during screen transitions
  const navTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: themeColors.background.primary(),
      card: themeColors.background.primary(),
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider>
        <CustomTabNavMetricsProvider>
        <ThemeProvider value={navTheme}>
          {/* Task stack and sub-screens share draft via context; DuplicateTaskProvider for pre-filling create from Duplicate */}
          <CreateTaskDraftProvider>
          <DuplicateTaskProvider>
          <PlannerMonthSelectProvider>
          <Stack
            screenOptions={{
              animation: 'default', // native iOS slide-from-right for all stack transitions
              gestureEnabled: true,
              contentStyle: { backgroundColor: themeColors.background.primary() },
            }}
          >
            {/* tabs first so cold start resolves to main app; onboarding is pushed on top when needed */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(onboarding)"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical',
                // outer card still gets default scroll-edge “fade” on ios; hide so intro carousel has no top strip
                ...(Platform.OS === 'ios'
                  ? {
                      scrollEdgeEffects: {
                        top: 'hidden' as const,
                        bottom: 'hidden' as const,
                        left: 'hidden' as const,
                        right: 'hidden' as const,
                      },
                    }
                  : {}),
              }}
            />
            {/* legacy create routes now mount the same quick-add overlay flow as Today */}
            <Stack.Screen
              name="task-create"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                gestureEnabled: false,
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen
              name="task-create-test"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                gestureEnabled: false,
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            {/* task-quick-add: transparentModal + animation none — fade + sheet motion are both driven in TaskQuickAddOverlay (native pop fade was cutting the slide short) */}
            <Stack.Screen
              name="task-quick-add"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                gestureEnabled: false,
                animation: 'none',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            {/* activity-log: use modal (not formSheet) so ScrollView scrolls properly – formSheet has known scroll conflicts */}
            <Stack.Screen
              name="activity-log"
              options={{
                headerShown: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }}
            />
            {/* task: view/edit form sheet with indent (detents) */}
            <Stack.Screen
              name="task"
              options={{
                headerShown: false,
                presentation: 'formSheet',
                gestureEnabled: true,
                sheetGrabberVisible: false,
                sheetAllowedDetents: [0.7, 1],
                // ios 26+ scroll edge “hard” style can show a line at the sheet header; hide edges on the presented route
                ...(Platform.OS === 'ios'
                  ? { scrollEdgeEffects: { top: 'hidden' as const, bottom: 'hidden' as const } }
                  : {}),
                contentStyle: {
                  backgroundColor: useLiquidGlass ? 'transparent' : 'transparent',
                },
              }}
            />
            {/* root-level picker screens (each has own folder with _layout + index) */}
            <Stack.Screen
              name="date-select"
              options={{
                headerShown: false,
                presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
                sheetGrabberVisible: false,
                sheetAllowedDetents: [0.8],
                sheetInitialDetentIndex: 0,
                contentStyle: {
                  backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
                },
              }}
            />
            <Stack.Screen
              name="time-duration-select"
              options={{
                headerShown: false,
                presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
                sheetGrabberVisible: false,
                sheetAllowedDetents: [0.7],
                sheetInitialDetentIndex: 0,
                contentStyle: {
                  backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
                },
              }}
            />
            <Stack.Screen
              name="alert-select"
              options={{
                headerShown: false,
                presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
                sheetGrabberVisible: false,
                sheetAllowedDetents: [0.7],
                sheetInitialDetentIndex: 0,
                contentStyle: {
                  backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
                },
              }}
            />
            <Stack.Screen
              name="list-select"
              options={{
                headerShown: false,
                presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
                sheetGrabberVisible: false,
                sheetAllowedDetents: [0.8],
                sheetInitialDetentIndex: 0,
                contentStyle: {
                  backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
                },
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          </PlannerMonthSelectProvider>
          </DuplicateTaskProvider>
          </CreateTaskDraftProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
        </CustomTabNavMetricsProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
