import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

// task creation modal orchestrates redux + form logic and renders taskcreationcontent inside
import { TaskCreationModal } from '@/components/features/tasks';

export default function SearchTaskCreationScreen() {
  // local state: controls visibility of the task creation modal when user taps the search tab
  const [isVisible, setIsVisible] = useState(true);

  // router: used to navigate back to the previous tab when the modal closes
  const router = useRouter();

  // handle close: hide modal and return to the previous tab (e.g. today)
  const handleClose = () => {
    setIsVisible(false);
    // go back to the last tab the user was on before tapping the search trigger
    router.back();
  };

  return (
    // simple wrapper view so the modal has a root react-native view to attach to
    <View style={{ flex: 1 }}>
      <TaskCreationModal visible={isVisible} onClose={handleClose} />
    </View>
  );
}

