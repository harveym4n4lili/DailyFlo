import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function BrowseScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Browse</Text>
      <Text style={styles.description}>This is the browse screen where users can view all their task lists and completed tasks.</Text>
    </ScreenContainer>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES --- (none - browse only has typography styles)

  // --- TYPOGRAPHY STYLES ---
  title: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    marginBottom: 16,
  },
  description: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    textAlign: 'center',
  },
});
