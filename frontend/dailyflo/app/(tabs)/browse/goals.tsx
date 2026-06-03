/**
 * Goals route — thin wrapper; UI lives in features/gamification.
 */

import React from 'react';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { GoalsScreenContent } from '@/components/features/gamification';

export default function GoalsScreen() {
  return (
    <>
      <IosBrowseBackStackToolbar />
      <GoalsScreenContent />
    </>
  );
}
