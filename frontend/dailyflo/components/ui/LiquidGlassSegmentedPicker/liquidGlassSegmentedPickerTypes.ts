/**
 * shared props for LiquidGlassSegmentedPicker — parent owns selected value (see LIQUID_GLASS_DAY_PICKER.md).
 */

export type LiquidGlassSegmentOption<T extends string> = {
  value: T;
  label: string;
};

/** fullWidth = screen-edge bleed (filters); compact = trailing inline control (e.g. grouped-list rows) */
export type LiquidGlassSegmentedPickerLayout = 'fullWidth' | 'compact';

export type LiquidGlassSegmentedPickerProps<T extends string> = {
  options: readonly LiquidGlassSegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** swift-ui segmented tint on ios; selected segment fill on android */
  accentColor?: string;
  layout?: LiquidGlassSegmentedPickerLayout;
};
