import type { ColorPaletteReturn } from '@/hooks/useColorPalette';
import type { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { Easing } from 'react-native-reanimated';
import { PROGRESS_BOARD_GLASS_BORDER_WIDTH } from '@/components/features/gamification/browse/progressBoardUiTokens';

/** hairline ring on ChatContainer innerBorderRing */
export const CHAT_COMPOSER_SHELL_BORDER_WIDTH = PROGRESS_BOARD_GLASS_BORDER_WIDTH;

/** suggestion pill dashed SVG stroke — 1px matches DashedSeparator + reads same weight as the solid composer ring */
export const CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH = 1;

/** same token as ChatContainer `innerBorderRing` borderColor */
export function getChatComposerShellBorderColor(
  themeColors: Pick<ReturnType<typeof useThemeColors>, 'border'>,
) {
  return themeColors.border.secondary();
}

/** shared ease for composer text expansion + suggestions fade */
export const CHAT_COMPOSER_LAYOUT_EASING = Easing.bezier(0.33, 1, 0.68, 1);

/** shared utility-button sizing for chat composer attach + send controls */
export const CHAT_UTILITY_BUTTON_SIZE = 40;
export const CHAT_UTILITY_BUTTON_RADIUS = CHAT_UTILITY_BUTTON_SIZE / 2;

/** inset from shell edge to utility buttons — matches bottomRow padding */
export const CHAT_COMPOSER_SHELL_INSET = Paddings.formDataPillHorizontal;

/** outer glass radius: button corner sits on a tangent — inset + button radius */
export const CHAT_COMPOSER_SHELL_RADIUS =
  CHAT_COMPOSER_SHELL_INSET + CHAT_UTILITY_BUTTON_RADIUS;

/** primary[50] chip + marple 500 icon — shared by attach menu and empty-state mic button */
export function getChatAttachChipColors(colors: ColorPaletteReturn) {
  return {
    background: colors.primary[50] ?? colors.primary[100],
    icon: colors.getMarpleBrandColor(500),
  };
}

/** marple fill + glyph — active send (upload) button when the field has text */
export function getChatSendButtonColors(colors: ColorPaletteReturn) {
  return {
    fill: colors.getMarpleBrandColor(500),
    icon: colors.getMarpleBrandColor(600),
  };
}

/** collapsed ↔ expanded text-section morph — shared by ChatContainer + suggestions */
export const CHAT_COMPOSER_LAYOUT_TRANSITION_MS = 480;

/** suggestions scale when the composer text section is expanded (1 = full size) */
export const CHAT_SUGGESTIONS_HIDDEN_SCALE = 0.94;

/** fixed utility row — attach + send/mic (does not animate) */
export const CHAT_COMPOSER_UTILITY_ROW_HEIGHT_ESTIMATE =
  CHAT_COMPOSER_SHELL_INSET * 2 + CHAT_UTILITY_BUTTON_SIZE;

/** collapsed text section is height 0 — preview lives inline in the utility row */
export const CHAT_COMPOSER_COLLAPSED_TEXT_HEIGHT_ESTIMATE = 0;

/** expanded text area — top inset + 3 lines + gap above utility row */
export const CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE =
  Paddings.groupedListChildContentVertical +
  20 * 3 +
  Paddings.formDataPillHorizontal;

/** whole shell fallback for layout until onLayout runs */
export const CHAT_COMPOSER_COLLAPSED_HEIGHT_ESTIMATE = CHAT_COMPOSER_UTILITY_ROW_HEIGHT_ESTIMATE;

export const CHAT_COMPOSER_EXPANDED_HEIGHT_ESTIMATE =
  CHAT_COMPOSER_EXPANDED_TEXT_HEIGHT_ESTIMATE + CHAT_COMPOSER_UTILITY_ROW_HEIGHT_ESTIMATE;
