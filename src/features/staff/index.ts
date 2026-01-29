// Types
export * from './types';

// API
export { createStaffApi, staffPositionApi } from './api';

// Stores (Zustand)
export {
  useStaffUIStore,
  selectShowInviteModal,
  selectSelectedStaff,
  selectEditingProfileStaff,
  selectStaffUIActions,
} from './stores/staffStore';

// Query Keys & Options
export { staffKeys, positionKeys, STAFF_QUERY_OPTIONS, POSITION_QUERY_OPTIONS } from './hooks/queries';

// Hooks
export { useStaff } from './hooks/useStaff';
export { useStaffPositions } from './hooks/useStaffPositions';
export { useStaffPageState, useStaffPermissions } from './hooks/useStaffPageState';
export { useStaffActions } from './hooks/useStaffActions';

// Views
export { default as StaffPageView } from './views/StaffPageView';
