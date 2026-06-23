/**
 * One AI proposal card — type chip, editable form, Confirm / Dismiss.
 * Confirm dispatches Redux task actions via useAiAssistant (not direct API calls here).
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import type {
  CreateProposalPayload,
  DeleteProposalPayload,
  ProposalStatus,
  TaskProposal,
  TaskProposalPayload,
  UpdateProposalPayload,
} from '@/types/api/llm';
import { AiProposalCreateForm } from './AiProposalCreateForm';
import { AiProposalUpdateForm } from './AiProposalUpdateForm';
import { AiProposalDeleteForm } from './AiProposalDeleteForm';

const TYPE_LABELS: Record<TaskProposal['type'], string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

export interface AiProposalCardProps {
  proposal: TaskProposal;
  payload: TaskProposalPayload;
  status: ProposalStatus;
  errorMessage?: string;
  taskTitle?: string;
  onChangePayload: (payload: TaskProposalPayload) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function AiProposalCard({
  proposal,
  payload,
  status,
  errorMessage,
  taskTitle = 'Unknown task',
  onChangePayload,
  onConfirm,
  onDismiss,
}: AiProposalCardProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const isDelete = proposal.type === 'delete';
  const isPending = status === 'pending' || status === 'failed';
  const isConfirming = status === 'confirming';
  const isConfirmed = status === 'confirmed';
  const isDismissed = status === 'dismissed';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 14,
          padding: Paddings.groupedListContentHorizontal,
          marginBottom: Paddings.groupedListIconTextSpacing,
          backgroundColor: themeColors.background.primarySecondaryBlend(),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: themeColors.border.primary(),
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        chip: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: isDelete
            ? themeColors.background.primary()
            : themeColors.background.invertedPrimary(),
        },
        chipText: {
          ...typography.getTextStyle('body-small'),
          color: isDelete
            ? themeColors.text.primary()
            : themeColors.text.invertedPrimary(),
          fontWeight: '600',
        },
        summary: {
          flex: 1,
          ...typography.getTextStyle('body-medium'),
          color: themeColors.text.primary(),
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 12,
        },
        btn: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
        },
        btnText: {
          ...typography.getTextStyle('body-medium'),
          fontWeight: '600',
        },
        statusLine: {
          ...typography.getTextStyle('body-medium'),
          color: themeColors.text.secondary(),
        },
        error: {
          ...typography.getTextStyle('body-small'),
          color: themeColors.text.primary(),
          marginTop: 8,
        },
      }),
    [themeColors, typography, isDelete]
  );

  if (isDismissed) {
    return (
      <View style={styles.card}>
        <Text style={styles.statusLine}>Dismissed: {proposal.summary}</Text>
      </View>
    );
  }

  if (isConfirmed) {
    return (
      <View style={styles.card}>
        <Text style={styles.statusLine}>Applied: {proposal.summary}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{TYPE_LABELS[proposal.type]}</Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {proposal.summary}
        </Text>
      </View>

      {proposal.type === 'create' ? (
        <AiProposalCreateForm
          payload={payload as CreateProposalPayload}
          onChange={onChangePayload}
          disabled={isConfirming}
        />
      ) : null}

      {proposal.type === 'update' ? (
        <AiProposalUpdateForm
          payload={payload as UpdateProposalPayload}
          taskTitle={taskTitle}
          onChange={onChangePayload}
          disabled={isConfirming}
        />
      ) : null}

      {proposal.type === 'delete' ? <AiProposalDeleteForm taskTitle={taskTitle} /> : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {isPending ? (
        <View style={styles.footer}>
          <Pressable
            onPress={onDismiss}
            disabled={isConfirming}
            style={[styles.btn, { backgroundColor: themeColors.background.primary() }]}
            accessibilityRole="button"
            accessibilityLabel={`Dismiss ${proposal.summary}`}
          >
            <Text style={[styles.btnText, { color: themeColors.text.secondary() }]}>Dismiss</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={isConfirming}
            style={[
              styles.btn,
              {
                backgroundColor: isDelete
                  ? themeColors.text.primary()
                  : themeColors.background.invertedPrimary(),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Confirm ${proposal.summary}`}
          >
            {isConfirming ? (
              <ActivityIndicator
                size="small"
                color={
                  isDelete
                    ? themeColors.background.primary()
                    : themeColors.text.invertedPrimary()
                }
              />
            ) : (
              <Text
                style={[
                  styles.btnText,
                  {
                    color: isDelete
                      ? themeColors.background.primary()
                      : themeColors.text.invertedPrimary(),
                  },
                ]}
              >
                Confirm
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
