import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function PlannerScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Planner</ThemedText>
      <ThemedText>This is the planner screen where users can view their monthly and weekly calendar.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
