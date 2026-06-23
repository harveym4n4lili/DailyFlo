/**
 * Editable fields for a create-task proposal.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { CreateProposalPayload } from '@/types/api/llm';

export interface AiProposalCreateFormProps {
  payload: CreateProposalPayload;
  onChange: (payload: CreateProposalPayload) => void;
  disabled?: boolean;
}

export function AiProposalCreateForm({ payload, onChange, disabled }: AiProposalCreateFormProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  return (
    <View style={styles.fields}>
      <Text style={[typography.getTextStyle('body-small'), { color: themeColors.text.secondary() }]}>
        Title
      </Text>
      <TextInput
        value={payload.title}
        onChangeText={(title) => onChange({ ...payload, title })}
        editable={!disabled}
        style={[
          styles.input,
          typography.getTextStyle('body-medium'),
          {
            color: themeColors.text.primary(),
            borderColor: themeColors.border.primary(),
            backgroundColor: themeColors.background.primary(),
          },
        ]}
        placeholder="Task title"
        placeholderTextColor={themeColors.text.tertiary()}
      />

      <Text
        style={[
          typography.getTextStyle('body-small'),
          { color: themeColors.text.secondary(), marginTop: 8 },
        ]}
      >
        Due date (YYYY-MM-DD)
      </Text>
      <TextInput
        value={payload.dueDate ?? ''}
        onChangeText={(dueDate) => onChange({ ...payload, dueDate: dueDate || undefined })}
        editable={!disabled}
        style={[
          styles.input,
          typography.getTextStyle('body-medium'),
          {
            color: themeColors.text.primary(),
            borderColor: themeColors.border.primary(),
            backgroundColor: themeColors.background.primary(),
          },
        ]}
        placeholder="2026-06-24"
        placeholderTextColor={themeColors.text.tertiary()}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: Paddings.groupedListIconTextSpacing,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
});
