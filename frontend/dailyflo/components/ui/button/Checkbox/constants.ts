/**
 * Checkbox dimension constants.
 * Change SCALE to resize the checkbox everywhere (2 = 48pt, 10 = 240pt).
 */

export const CHECKBOX_BASE_SIZE = 4;
export const SCALE = 16; // single value to change - controls all checkbox dimensions (2 = 48pt, 10 = 240pt)

// per-component sizes (TaskCard/subtask use 16, Task view title uses 18)
export const CHECKBOX_SIZE_TASK_CARD = 20;
export const CHECKBOX_SIZE_TASK_VIEW = 24;
export const CHECKBOX_SIZE_SUBTASK = 20;

export const CHECKBOX_EFFECTIVE_SIZE = CHECKBOX_BASE_SIZE * SCALE;

// particles layer: larger than checkbox so burst animation can extend past boundaries
export const PARTICLE_LAYER_MULTIPLIER = 3;

// minimum tap target size (iOS recommendation 44pt) - used when expandTapArea is true
export const CHECKBOX_MIN_TAP_AREA = 44;
