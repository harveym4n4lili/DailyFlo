import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

export default function NotFoundScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ScreenContainer>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={[styles.link, styles.linkPadding]}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </ScreenContainer>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  link: {
    marginTop: 15,
  },

  // --- PADDING STYLES ---
  linkPadding: {
    paddingVertical: Paddings.listItemVertical + Paddings.touchTargetSmall,
  },

  // --- TYPOGRAPHY STYLES ---
  title: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    textAlign: 'center',
    marginBottom: 20,
  },
  linkText: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    textAlign: 'center',
  },
});
