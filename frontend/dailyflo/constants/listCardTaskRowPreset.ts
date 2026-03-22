/**
 * shared ListCard props that control how each TaskCard looks (Today’s flat list: dashed rules, no card chrome).
 * ListCard still renders TaskCard internally — screens spread this preset so Today, browse lists, etc. stay in sync.
 */
import type { ListCardProps } from '@/components/ui/card';

export type ListCardTaskRowPreset = Pick<
  ListCardProps,
  | 'showCategory'
  | 'compact'
  | 'showIcon'
  | 'showIndicators'
  | 'showMetadata'
  | 'metadataVariant'
  | 'cardSpacing'
  | 'showDashedSeparator'
  | 'hideBackground'
  | 'removeInnerPadding'
>;

/** use on ListCard together with screen-specific props (tasks, groupBy, scroll, handlers) */
export const LIST_CARD_TASK_ROW_PRESET_TODAY: ListCardTaskRowPreset = {
  showCategory: false,
  compact: false,
  showIcon: false,
  showIndicators: false,
  showMetadata: false,
  metadataVariant: 'today',
  cardSpacing: 0,
  showDashedSeparator: true,
  hideBackground: true,
  removeInnerPadding: true,
};
