// ============================================
// Staff Feature - Public API
// ============================================

// Types
export * from './types';

// API
export { staffApi, positionApi } from './api';
// Legacy exports (for backward compatibility)
export { createStaffApi, staffPositionApi } from './api';

// Stores (Zustand - UI State)
export {
  useStaffUIStore,
  // Selectors
  selectShowInviteModal,
  selectSelectedStaff,
  selectEditingProfileStaff,
  selectStaffUIActions,
  // Optimized hooks
  useStaffModals,
  useStaffUIActions,
  useInviteModalOpen,
  usePermissionModalStaff,
  useProfileModalStaff,
} from './stores/staffStore';

// Query Keys & Options (TanStack Query)
export {
  staffKeys,
  positionKeys,
  staffQueries,
  positionQueries,
  // Constants
  STAFF_STALE_TIME,
  STAFF_GC_TIME,
  POSITION_STALE_TIME,
  POSITION_GC_TIME,
  // Legacy
  STAFF_QUERY_OPTIONS,
  POSITION_QUERY_OPTIONS,
} from './hooks/queries';

// Hooks
export { useStaff } from './hooks/useStaff';
export type { UseStaffReturn } from './hooks/useStaff';

export { useStaffPositions } from './hooks/useStaffPositions';
export type { UseStaffPositionsReturn } from './hooks/useStaffPositions';

export { useStaffPageState, useStaffPermissions } from './hooks/useStaffPageState';
export { useStaffActions } from './hooks/useStaffActions';

// Views
export { default as StaffPageView } from './views/StaffPageView';

// Server Actions
export { createStaff, inviteStaff, deleteStaff, softDeleteStaff, cancelResignation } from './actions';
