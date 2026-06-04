/**
 * shared props for LiquidGlassSegmentedPicker — parent owns selected value (see LIQUID_GLASS_DAY_PICKER.md).
 */

export type LiquidGlassSegmentOption<T extends string> = {
  value: T;
  label: string;
};

export type LiquidGlassSegmentedPickerProps<T extends string> = {
  options: readonly LiquidGlassSegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};
