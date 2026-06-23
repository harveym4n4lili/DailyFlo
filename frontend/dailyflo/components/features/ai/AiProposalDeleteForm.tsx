/**
 * Delete proposal — shows task name and warning before Confirm.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

export interface AiProposalDeleteFormProps {
  taskTitle: string;
}

export function AiProposalDeleteForm({ taskTitle }: AiProposalDeleteFormProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  return (
    <View style={styles.wrap}>
      <Text style={[typography.getTextStyle('body-medium'), { color: themeColors.text.primary() }]}>
        Delete “{taskTitle}”?
      </Text>
      <Text
        style={[
          typography.getTextStyle('body-small'),
          { color: themeColors.text.secondary(), marginTop: 6 },
        ]}
      >
        This removes the task when you confirm.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Paddings.groupedListIconTextSpacing,
  },
});
