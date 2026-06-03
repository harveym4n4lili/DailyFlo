/**
 * Productivity route — hub for goals, achievements, and completed activity.
 */

import React from 'react';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { ProductivityScreenContent } from '@/components/features/gamification';

export default function ProductivityScreen() {
  return (
    <>
      <IosBrowseBackStackToolbar />
      <ProductivityScreenContent />
    </>
  );
}
