/**
 * Components Index
 * 
 * This file provides barrel exports for all components in the app,
 * organized by category. This makes imports cleaner and more organized.
 * 
 * Usage:
 * import { ScreenContainer, ThemedText, ThemedView } from '@/components';
 */

// layout components - screen and modal layout components
export * from './layout';

// ui components - basic ui components
export * from './ui';

// themed components - theme-aware text and view components
export { ThemedText } from './ThemedText';
export { ThemedView } from './ThemedView';

// re-export themed component types for convenience
export type { ThemedTextProps } from './ThemedText';
export type { ThemedViewProps } from './ThemedView';
