import type { ColorPaletteReturn } from '@/hooks/useColorPalette';

/** shared utility-button sizing for chat composer attach + send controls */
export const CHAT_UTILITY_BUTTON_SIZE = 40;

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
