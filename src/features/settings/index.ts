// Types
export type { StoreInfo, Plan, Subscription, AccountInfo, SettingsTab } from './types';

// API
export { settingsApi } from './api';

// Stores (Zustand) - UI 상태만 관리
export {
  useSettingsUIStore,
  selectActiveTab,
  selectIsVerificationSent,
  selectEditingField,
  selectTempValue,
  selectSettingsActions,
  selectIsEditingName,
  selectIsEditingAddress,
  selectIsEditingInstagram,
} from './stores/settingsStore';

// Query Keys & Hooks (TanStack Query) - 서버 데이터 관리
export {
  settingsKeys,
  useStoreInfo,
  usePlans,
  useSubscription,
  usePhoneVerification,
  usePasswordChange,
} from './hooks/useSettings';

export { useSalonData } from './hooks/useSalonData';

// Views
export { default as SettingsPageView } from './views/SettingsPageView';
