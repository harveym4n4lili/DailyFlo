/**
 * ActionsButton - re-exports ActionContextMenu for backward compatibility.
 * Use ActionContextMenu from @/components/ui/contextMenu for new code.
 *
 * Imports from contextMenu directly to avoid circular dependency:
 * ui -> button -> ActionsButton -> ui would cause ActionContextMenu to be undefined.
 */

export {
  ActionContextMenu as ActionsButton,
  type ActionContextMenuItem as ActionsButtonItem,
  type ActionContextMenuProps as ActionsButtonProps,
} from '../../contextMenu';
