import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ReduxProvider } from '@/store/Provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // load all the fonts we need for the app
  // this tells expo-font to load the satoshi font files
  // each font gets a name that we can use in our typography system
  const [loaded] = useFonts({
    // keep the existing space mono font (we can remove this later if not needed)
    //SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    
    // satoshi font family - these are the main fonts for our app
    // the names here must match what we use in our typography constants
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
  });

  // wait for fonts to load before showing the app
  // this prevents text from showing with wrong fonts while loading
  if (!loaded) {
    // return null means don't show anything until fonts are ready
    // this only happens in development - in production fonts are bundled
    return null;
  }

  return (
    <ReduxProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ReduxProvider>
  );
}
