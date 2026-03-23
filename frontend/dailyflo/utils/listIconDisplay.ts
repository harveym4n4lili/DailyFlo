/**
 * list icon display helpers
 *
 * lists store `icon` as a short string id (same idea as tasks). we map that to:
 * - an SF Symbol name for SFSymbolIcon on ios
 * - an Ionicons glyph name for android/web fallback
 */

import { Ionicons } from '@expo/vector-icons';

export type IonIconName = keyof typeof Ionicons.glyphMap;

// sf symbol names understood by expo-symbols / SFSymbolIcon wrapper
const SF_BY_ID: Record<string, string> = {
  briefcase: 'briefcase',
  'briefcase-outline': 'briefcase',
  home: 'house',
  'home-outline': 'house',
  calendar: 'calendar',
  'calendar-outline': 'calendar',
  leaf: 'leaf',
  checkmark: 'checkmark.circle',
  'checkmark-circle': 'checkmark.circle',
  'checkmark-circle-outline': 'checkmark.circle',
  person: 'person',
  'person-outline': 'person',
  cart: 'cart',
  'cart-outline': 'cart',
  fitness: 'figure.walk',
  heart: 'heart',
  'heart-outline': 'heart',
  star: 'star',
  'star-outline': 'star',
  book: 'book',
  'book-outline': 'book',
  school: 'graduationcap',
  work: 'briefcase',
};

// ionicons names for non-ios or when SF is unavailable
const ION_BY_ID: Record<string, IonIconName> = {
  briefcase: 'briefcase-outline',
  'briefcase-outline': 'briefcase-outline',
  home: 'home-outline',
  'home-outline': 'home-outline',
  calendar: 'calendar-outline',
  leaf: 'leaf-outline',
  checkmark: 'checkmark-circle-outline',
  person: 'person-outline',
  cart: 'cart-outline',
  fitness: 'walk-outline',
  heart: 'heart-outline',
  star: 'star-outline',
  book: 'book-outline',
  school: 'school-outline',
  work: 'briefcase-outline',
};

export function listIconSFSymbol(icon: string | undefined): string {
  if (!icon) return 'list.bullet';
  return SF_BY_ID[icon] ?? 'list.bullet';
}

export function listIconIonName(icon: string | undefined): IonIconName {
  if (!icon) return 'list-outline';
  return ION_BY_ID[icon] ?? 'list-outline';
}
