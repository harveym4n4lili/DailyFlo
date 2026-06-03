/**
 * Achievements route — thin wrapper; UI lives in features/gamification.
 */

import React from 'react';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { AchievementsScreenContent } from '@/components/features/gamification';

export default function AchievementsScreen() {
  return (
    <>
      <IosBrowseBackStackToolbar />
      <AchievementsScreenContent />
    </>
  );
}
