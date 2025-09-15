import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TodayScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Today</ThemedText>
        <ThemedText style={styles.subtitle}>Your tasks for today</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedText>No tasks for today yet.</ThemedText>
        <ThemedText style={styles.hint}>Tap the + button to add your first task!</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
});
