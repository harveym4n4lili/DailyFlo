import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function BrowseScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Browse</Text>
      <Text style={styles.description}>This is the browse screen where users can view all their task lists and completed tasks.</Text>
    </ScreenContainer>
  );
}

const createStyles = (themeColors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: themeColors.text.primary(),
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.text.secondary(),
    textAlign: 'center',
  },
});
