import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ReduxProvider } from '@/store/Provider';

// storage key for tracking onboarding completion status
// this key is used to check if the user has completed the onboarding flow
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  
  // state to track if we're still checking onboarding status
  // this prevents showing the app before we know where to route the user
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // ref to track if we've already done the initial navigation check
  // this prevents the useEffect from running multiple times and causing flashing
  const hasNavigatedRef = useRef(false);
  
  // load all the fonts we need for the app
  // this tells expo-font to load the satoshi font files
  // each font gets a name that we can use in our typography system
  const [loaded] = useFonts({
    // keep the existing space mono font (we can remove this later if not needed)
    //SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    
    // satoshi font family - these are the main fonts for our app
    // for react native, we need to use the exact font family names
    'Satoshi': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
  });

  /**
   * Check onboarding completion status on app launch
   * This determines whether to show onboarding screens or the main app
   * 
   * Flow:
   * 1. Check AsyncStorage for onboarding completion flag
   * 2. If complete → route to main app (tabs)
   * 3. If not complete → route to onboarding welcome screen
   * 4. On error → default to onboarding (safer for new users)
   * 
   * We use a ref to ensure this only runs once, preventing flashing
   * We only depend on 'loaded' to avoid re-running when segments change
   */
  useEffect(() => {
    // prevent multiple navigation checks - only do this once
    if (hasNavigatedRef.current || !loaded) {
      return;
    }
    
    const checkOnboardingStatus = async () => {
      try {
        // check if user has completed onboarding by reading from AsyncStorage
        // AsyncStorage is a simple key-value storage system for React Native
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        
        // mark that we've started navigation check to prevent re-running
        hasNavigatedRef.current = true;
        
        // small delay to allow router to initialize and prevent flash
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // get current route group from segments to check if we're already on the correct route
        // segments will be like ["(onboarding)", "welcome"] or ["(tabs)", "today"]
        const currentGroup = segments[0];
        
        if (onboardingComplete === 'true') {
          // user has completed onboarding, route to main app
          // only navigate if we're not already on the tabs route
          if (currentGroup !== '(tabs)') {
            // use replace instead of push to prevent going back to onboarding
            router.replace('/(tabs)');
          }
        } else {
          // user hasn't completed onboarding, show welcome screen
          // only navigate if we're not already on the onboarding route
          if (currentGroup !== '(onboarding)') {
            // this is the first screen in the onboarding flow
            router.replace('/(onboarding)/welcome');
          }
        }
      } catch (error) {
        // if there's an error reading from storage, default to showing onboarding
        // this is safer because new users should see onboarding
        console.error('Failed to check onboarding status:', error);
        
        // mark as navigated
        hasNavigatedRef.current = true;
        
        // only navigate if we're not already on onboarding
        const currentGroup = segments[0];
        if (currentGroup !== '(onboarding)') {
          router.replace('/(onboarding)/welcome');
        }
      } finally {
        // always set checking to false so the app can render
        // this happens whether the check succeeded or failed
        setIsCheckingOnboarding(false);
      }
    };
    
    // start the check
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]); // only depend on loaded - segments and router are stable references

  // wait for fonts to load before showing the app
  // this prevents text from showing with wrong fonts while loading
  // also wait for onboarding check to complete
  if (!loaded || isCheckingOnboarding) {
    // return null means don't show anything until fonts are ready and onboarding check is done
    // this only happens in development - in production fonts are bundled
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
