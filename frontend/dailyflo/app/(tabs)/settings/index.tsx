import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.description}>This is the settings screen where users can manage their account and app preferences.</Text>
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
