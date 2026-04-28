import type { ImageSourcePropType } from 'react-native';

/** one tab in the custom liquid navbar — edit labels/routes in customTabNavItems.ts */
export type CustomTabNavItem = {
  key: string;
  href: string;
  source: ImageSourcePropType;
  label: string;
};
