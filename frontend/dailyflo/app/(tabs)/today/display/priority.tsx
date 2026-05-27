import { DisplaySettingsSubScreenShell } from '@/components/features/display/DisplaySettingsSubScreenShell';
import { DISPLAY_SORT_OPTION_TITLES } from '@/components/features/display/displayStackChrome';

export default function TodayDisplayPriorityScreen() {
  return <DisplaySettingsSubScreenShell title={DISPLAY_SORT_OPTION_TITLES.priority} />;
}
