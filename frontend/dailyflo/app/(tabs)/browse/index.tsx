import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function BrowseScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Browse</ThemedText>
      <ThemedText>This is the browse screen where users can view all their task lists and completed tasks.</ThemedText>
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
