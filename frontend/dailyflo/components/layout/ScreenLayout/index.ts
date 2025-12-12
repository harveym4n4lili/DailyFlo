/**
 * ScreenLayout Components Index
 * 
 * This file provides barrel exports for screen layout components,
 * following the architecture plan structure.
 */

// screen layout components
export { ScreenContainer, default as ScreenContainerDefault } from './ScreenContainer';
export { SafeAreaWrapper, default as SafeAreaWrapperDefault } from './SafeAreaWrapper';

// keyboard-related components and hooks
export * from './Keyboard';

// re-export types for convenience
export type { ScreenContainerProps } from './ScreenContainer';
export type { SafeAreaWrapperProps } from './SafeAreaWrapper';
