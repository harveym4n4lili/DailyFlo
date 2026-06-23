/**
 * Editable fields for an update-task proposal.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type { UpdateProposalPayload } from '@/types/api/llm';

export interface AiProposalUpdateFormProps {
  payload: UpdateProposalPayload;
  taskTitle: string;
  onChange: (payload: UpdateProposalPayload) => void;
  disabled?: boolean;
}

export function AiProposalUpdateForm({
  payload,
  taskTitle,
  onChange,
  disabled,
}: AiProposalUpdateFormProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const updates = payload.updates ?? {};

  return (
    <View style={styles.fields}>
      <Text style={[typography.getTextStyle('body-medium'), { color: themeColors.text.primary() }]}>
        Task: {taskTitle}
      </Text>

      {'title' in updates ? (
        <>
          <Text
            style={[
              typography.getTextStyle('body-small'),
              { color: themeColors.text.secondary(), marginTop: 8 },
            ]}
          >
            New title
          </Text>
          <TextInput
            value={updates.title ?? ''}
            onChangeText={(title) =>
              onChange({ ...payload, updates: { ...updates, title } })
            }
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
          />
        </>
      ) : null}

      {'dueDate' in updates ? (
        <>
          <Text
            style={[
              typography.getTextStyle('body-small'),
              { color: themeColors.text.secondary(), marginTop: 8 },
            ]}
          >
            New due date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={(updates.dueDate as string) ?? ''}
            onChangeText={(dueDate) =>
              onChange({ ...payload, updates: { ...updates, dueDate: dueDate || null } })
            }
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
            autoCapitalize="none"
          />
        </>
      ) : null}
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
