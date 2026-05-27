import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_300Light,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack, type Href, usePathname, useSegments } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { fetchLists } from '@/store/slices/lists/listsSlice';
import { fetchTasks } from '@/store/slices/tasks/tasksSlice';
import { isRouteAlreadyShowingToday } from '@/utils/navigation/bootstrapRouteUtils';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { InteractionManager, Platform, TextInput } from 'react-native';

// set default cursor/selection color app-wide; RN 0.83 types omit defaultProps but the merge still works at runtime
const TI = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
TI.defaultProps = { ...(TI.defaultProps || {}), selectionColor: '#FFFFFF', cursorColor: '#FFFFFF' };
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColors } from '@/hooks/useColorPalette';
import { ReduxProvider } from '@/store/Provider';
import { AuthSessionGate } from '@/components/navigation/AuthSessionGate';
import { CustomTabNavMetricsProvider } from '@/contexts/CustomTabNavMetricsContext';
import { CreateTaskDraftProvider } from './task/CreateTaskDraftContext';
import { DuplicateTaskProvider } from './task/DuplicateTaskContext';
import { PlannerMonthSelectProvider } from './PlannerMonthSelectContext';
import { store } from '@/store';
import { logout, checkAuthStatus } from '@/store/slices/auth/authSlice';
import {
  getDeviceOnboardingComplete,
  hasUserEverCompletedOnboarding,
} from '@/utils/onboarding/onboardingUserStatus';
import { setupNotifications } from '@/services/notifications/notificationsSetup';
import { NotificationResponseHandler } from '@/components/navigation/NotificationResponseHandler';

// typed routes lag behind new files until expo regenerates — cast keeps router.push happy
const ONBOARDING_AUTH_HREF = '/(onboarding)/auth' as Href;

// prefer tabs on cold start / restores — pairs with `<Stack initialRouteName="(tabs)">`
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useGuardedRouter();
  const pathname = usePathname();
  const segments = useSegments();
  // read inside async bootstrap after delays — ref always holds latest tree position
  const routeSnapshotRef = useRef({ pathname: '', segments: [] as string[] });
  routeSnapshotRef.current = { pathname, segments: [...segments] };
  // theme background used when liquid glass is not available (android or older ios)
  const themeColors = useThemeColors();
  const tabBarBackgroundColor = themeColors.background.primary();
  // liquid glass: on iOS (not iPad) we let expo-glass-effect decide if glass is supported internally.
  // older SDKs may not export isGlassEffectAPIAvailable, so we avoid calling it directly.
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  
  // ref to track if we've already done the initial navigation check
  // this prevents the useEffect from running multiple times and causing flashing
  const hasNavigatedRef = useRef(false);
  
  // inter: app-wide — satoshi (auth landing): prefer **.otf** from `assets/fonts` (`useFonts` keys must match `getSatoshiFontFamilyWithWeight` in `constants/Typography.ts`)
  const [loaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    // your kit may only include black as `.ttf`; switch to `Satoshi-Black.otf` when that file is in this folder
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
  });

  // register foreground handler + android channel once — required before any notification can display
  useEffect(() => {
    void setupNotifications();
  }, []);

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

        const onboardingComplete = await getDeviceOnboardingComplete();

        await store.dispatch(checkAuthStatus());

        let authState = store.getState().auth;

        // stale session on a fresh install — but keep tokens when this account already finished onboarding before (returning re-login)
        const accountFinishedOnboardingBefore =
          authState.user != null && (await hasUserEverCompletedOnboarding(authState.user));
        if (!onboardingComplete && authState.isAuthenticated && !accountFinishedOnboardingBefore) {
          store.dispatch(logout());
          authState = store.getState().auth;
        }

        // start task/list loads before Today paints when session restores — reduces empty-state flicker
        if (authState.isAuthenticated) {
          const { tasks, lists } = store.getState();
          if (tasks.lastFetched === null) {
            void store.dispatch(fetchTasks());
          }
          if (lists.lastFetched === null) {
            void store.dispatch(fetchLists());
          }
        }

        // skip redundant replace when tabs already on Today — second replace was animating like a duplicate screen
        const { pathname: bootstrapPath, segments: bootstrapSegs } = routeSnapshotRef.current;
        if (!isRouteAlreadyShowingToday(bootstrapPath, bootstrapSegs)) {
          router.replace('/(tabs)/today');
        }

        const needsOnboarding = !onboardingComplete || !authState.isAuthenticated;
        // push on the same tick as replace can hard-crash the native stack — wait until transitions settle
        if (needsOnboarding) {
          InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
              router.push(ONBOARDING_AUTH_HREF);
            });
          });
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);

        hasNavigatedRef.current = true;

        const authState = store.getState().auth;
        if (authState.isAuthenticated) {
          store.dispatch(logout());
        }

        const { pathname: errPath, segments: errSegs } = routeSnapshotRef.current;
        if (!isRouteAlreadyShowingToday(errPath, errSegs)) {
          router.replace('/(tabs)/today');
        }
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => {
            router.push(ONBOARDING_AUTH_HREF);
          });
        });
      }
    };

    // bootstrap runs after the root Stack mounts (we only return null until fonts load). calling replace/push
    // before the Stack existed could strand navigation on a blank screen.
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // wait for fonts only — the root Stack must mount before bootstrap runs router.replace/push (see useEffect above)
  if (!loaded) {
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
            initialRouteName="(tabs)"
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
                sheetAllowedDetents: [0.8, 1],
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
              name="alert-offset-select"
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
          <NotificationResponseHandler />
          <AuthSessionGate />
        </ThemeProvider>
        </CustomTabNavMetricsProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
