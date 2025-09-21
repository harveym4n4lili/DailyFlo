import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function NotFoundScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ScreenContainer>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </ScreenContainer>
    </>
  );
}

const createStyles = (themeColors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: themeColors.text.primary(),
    textAlign: 'center',
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    textAlign: 'center',
  },
});
