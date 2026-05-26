/**
 * htmlstudio/react — drop-in React components for the visual editor surface.
 *
 * Peer deps: react, react-dom, @phosphor-icons/react.
 * Styling: Tailwind CSS with a `brand-*` color scale (e.g. `brand-500`).
 * If your project doesn't use Tailwind, import `htmlstudio/styles.css`
 * (precompiled) once at the app root.
 */
export { useVisualEdit } from './useVisualEdit.js';
export type {
  UseVisualEditOptions,
  VisualEdit,
  SaveState,
  SaveStatus,
} from './useVisualEdit.js';

export { PreviewFrame } from './PreviewFrame.js';
export type { PreviewFrameProps } from './PreviewFrame.js';

export { DeviceFrame, DEFAULT_FRAMES } from './DeviceFrame.js';
export type { DeviceFrameProps, FrameDef } from './DeviceFrame.js';

export { DeviceSwitcher } from './DeviceSwitcher.js';
export type { DeviceSwitcherProps, DeviceOption } from './DeviceSwitcher.js';

export { ZoomControls } from './ZoomControls.js';
export type { ZoomControlsProps } from './ZoomControls.js';

export { BlocksPanel } from './BlocksPanel.js';
export type { BlocksPanelProps, ProjectBlockMeta } from './BlocksPanel.js';

export { BlockConfigForm } from './BlockConfigForm.js';
export type { BlockConfigFormProps } from './BlockConfigForm.js';

export { EditInspector } from './EditInspector.js';
export type { EditInspectorProps, RerenderBlockArgs } from './EditInspector.js';

export { RightRail } from './RightRail.js';
export type { RightRailProps } from './RightRail.js';

export { ChatSidebar, ChatInput } from './ChatSidebar.js';
export type {
  ChatMessage,
  ChatSidebarProps,
  ChatInputProps,
} from './ChatSidebar.js';
