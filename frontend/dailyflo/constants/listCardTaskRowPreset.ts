/**
 * shared ListCard props that control how each TaskCard looks (Today / browse search: solid row rules, no card chrome).
 * ListCard still renders TaskCard internally — screens spread this preset so Today, browse lists, etc. stay in sync.
 */
/** explicit row-chrome preset (separator style: solid by default on TaskCard; planner overrides to dashed) */
export type ListCardTaskRowPreset = {
  showCategory: boolean;
  compact: boolean;
  showIcon: boolean;
  showIndicators: boolean;
  showMetadata: boolean;
  metadataVariant: 'default' | 'today';
  cardSpacing: number;
  showDashedSeparator: boolean;
  hideBackground: boolean;
  removeInnerPadding: boolean;
};

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
