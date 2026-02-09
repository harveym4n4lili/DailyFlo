/**
 * GroupedListItem Component (DEPRECATED)
 *
 * @deprecated Use FormDetailButton wrapped in GroupedList instead.
 * This component is kept for backward compatibility.
 *
 * Individual row item within a GroupedList.
 * Now uses FormDetailButton internally for consistency.
 */

import React from 'react';
import { View } from 'react-native';
import { FormDetailButton } from '@/components/ui/button/TaskButton';
import { GroupedListItemWrapper } from './GroupedListItemWrapper';
import type { GroupedListItemProps } from './GroupedList.types';

/**
 * GroupedListItem Component (DEPRECATED)
 * 
 * @deprecated Use FormDetailButton wrapped in GroupedList instead.
 * This component wraps FormDetailButton with the position and separator styling.
 */
export const GroupedListItem: React.FC<GroupedListItemProps> = ({
  config,
  position,
  showSeparator,
  borderRadius,
  separatorColor,
  itemStyle,
}) => {
  return (
    <GroupedListItemWrapper
      position={position}
      showSeparator={showSeparator}
      borderRadius={borderRadius}
      separatorColor={separatorColor}
      style={itemStyle}
    >
      <FormDetailButton
        icon={config.icon}
        label={config.label}
        value={config.value}
        secondaryValue={config.secondaryValue}
        onPress={config.onPress}
        disabled={config.disabled}
        customStyles={config.customStyles}
      />
    </GroupedListItemWrapper>
  );
};

export default GroupedListItem;
