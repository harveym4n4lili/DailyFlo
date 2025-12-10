/**
 * WrappedDraggableModal
 * 
 * DraggableModal wrapped in React Native Modal component for slide animation.
 * This provides the built-in slide-up animation from Modal while preserving
 * DraggableModal's drag functionality.
 * 
 * Note: This component does NOT include a backdrop. Use ModalBackdrop separately
 * in the parent component to render a backdrop that fades in independently.
 * 
 * Use this when you want the slide animation from Modal.
 * Use DraggableModal directly when you want custom animation (like form picker modals).
 */

import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { DraggableModal, DraggableModalProps } from './DraggableModal';

export interface WrappedDraggableModalProps extends DraggableModalProps {
  // backdrop is handled separately by ModalBackdrop component
  // showBackdrop prop is ignored - always false
  
  /**
   * Whether to allow backdrop tap to dismiss
   * @default true
   */
  backdropDismiss?: boolean;
}

/**
 * WrappedDraggableModal Component
 * 
 * Wraps DraggableModal in Modal component for slide animation.
 * Backdrop should be rendered separately using ModalBackdrop component.
 */
export function WrappedDraggableModal({
  visible,
  onClose,
  backdropDismiss = true,
  ...draggableModalProps
}: WrappedDraggableModalProps) {
  const handleBackdropPress = () => {
    if (backdropDismiss) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      transparent={true}
    >
      {/* invisible backdrop tap area - allows tapping outside modal to close */}
      {/* positioned absolutely to cover entire screen, behind modal content */}
      {/* visual backdrop is handled separately by ModalBackdrop component */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={handleBackdropPress}
        pointerEvents={visible && backdropDismiss ? 'auto' : 'none'}
      />

      {/* Modal container - contains draggable modal content */}
      {/* uses box-none to allow backdrop Pressable to receive touches in transparent areas */}
      <View
        style={[styles.modalContainer, { zIndex: 10001 }]}
        pointerEvents="box-none"
      >
        {/* DraggableModal inside Modal wrapper - backdrop always disabled */}
        <DraggableModal
          visible={visible}
          onClose={onClose}
          showBackdrop={false}
          {...draggableModalProps}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
});

export default WrappedDraggableModal;

