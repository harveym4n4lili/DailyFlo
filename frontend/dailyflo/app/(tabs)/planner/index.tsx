import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function PlannerScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Planner</Text>
      <Text style={styles.description}>This is the planner screen where users can view their monthly and weekly calendar.</Text>
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
