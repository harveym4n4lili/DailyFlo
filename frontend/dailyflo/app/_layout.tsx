import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_300Light,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack, type Href, router } from 'expo-router';

import { runAppColdStartBootstrap } from '@/utils/navigation/appColdStartBootstrap';
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
import { setupNotifications } from '@/services/notifications/notificationsSetup';
import { NotificationResponseHandler } from '@/components/navigation/NotificationResponseHandler';

// typed routes lag behind new files until expo regenerates — cast keeps router.push happy
const ONBOARDING_AUTH_HREF = '/(onboarding)/auth' as Href;

// prefer tabs on cold start / restores — pairs with `<Stack initialRouteName="(tabs)">`
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
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

  useEffect(() => {
    void setupNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider>
        <RootLayoutNavigation />
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNavigation() {
  const colorScheme = useColorScheme();
  const hasBootstrappedRef = useRef(false);
  // theme background used when liquid glass is not available (android or older ios)
  const themeColors = useThemeColors();
  // liquid glass: on iOS (not iPad) we let expo-glass-effect decide if glass is supported internally.
  // older SDKs may not export isGlassEffectAPIAvailable, so we avoid calling it directly.
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

  // hydrate auth + prefetch tasks/lists; primary tab navigation runs in (tabs)/_layout.tsx
  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    void runAppColdStartBootstrap()
      .then(({ needsOnboarding }) => {
        if (needsOnboarding) {
          InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
              router.push(ONBOARDING_AUTH_HREF);
            });
          });
        }
      })
      .catch((error) => {
        console.error('Cold start bootstrap failed:', error);
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => {
            router.push(ONBOARDING_AUTH_HREF);
          });
        });
      });
  }, []);

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
  );
}
