'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { Staff } from '../types';
import {
  useStaffUIStore,
  selectShowInviteModal,
  selectSelectedStaff,
  selectEditingProfileStaff,
} from '../stores/staffStore';

// 전화번호 포맷 정규식을 모듈 레벨로 호이스팅
const PHONE_REGEX = /(\d{3})(\d{4})(\d{4})/;

// 역할 키 매핑 (불변 객체)
const ROLE_KEYS: Readonly<Record<string, string>> = {
  ADMIN: 'roles.admin',
  MANAGER: 'roles.manager',
  STAFF: 'roles.staff',
} as const;

interface UseStaffPageStateReturn {
  // Modal states (from Zustand)
  showInviteModal: boolean;
  selectedStaff: Staff | null;
  editingProfileStaff: Staff | null;
  // Actions (from Zustand)
  openInviteModal: () => void;
  closeInviteModal: () => void;
  selectStaffForPermission: (staff: Staff) => void;
  clearSelectedStaff: () => void;
  selectStaffForProfileEdit: (staff: Staff) => void;
  clearEditingProfileStaff: () => void;
  // Utilities
  formatPhone: (phone?: string) => string;
  formatDate: (dateString: Date) => string;
  getRoleName: (role?: string) => string;
}

export function useStaffPageState(): UseStaffPageStateReturn {
  const t = useTranslations('staff');

  // Zustand state - useShallow로 불필요한 리렌더링 방지
  const showInviteModal = useStaffUIStore(selectShowInviteModal);
  const selectedStaff = useStaffUIStore(selectSelectedStaff);
  const editingProfileStaff = useStaffUIStore(selectEditingProfileStaff);

  // Zustand actions - useShallow로 안정적 참조 유지
  const actions = useStaffUIStore(
    useShallow((state) => ({
      openInviteModal: state.openInviteModal,
      closeInviteModal: state.closeInviteModal,
      selectStaffForPermission: state.selectStaffForPermission,
      clearSelectedStaff: state.clearSelectedStaff,
      selectStaffForProfileEdit: state.selectStaffForProfileEdit,
      clearEditingProfileStaff: state.clearEditingProfileStaff,
    }))
  );

  // Utility functions - useCallback으로 안정적 참조 유지
  const formatPhone = useCallback((phone?: string): string => {
    if (!phone) return '-';
    return phone.replace(PHONE_REGEX, '$1-$2-$3');
  }, []);

  const formatDate = useCallback((dateString: Date): string => {
    const d = new Date(dateString);
    const yy = d.getFullYear().toString().slice(2);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${yy}. ${m}. ${day}`;
  }, []);

  const getRoleName = useCallback(
    (role?: string): string => {
      const key = ROLE_KEYS[role || ''] || 'roles.staff';
      return t(key);
    },
    [t]
  );

  return useMemo(
    () => ({
      showInviteModal,
      selectedStaff,
      editingProfileStaff,
      ...actions,
      formatPhone,
      formatDate,
      getRoleName,
    }),
    [
      showInviteModal,
      selectedStaff,
      editingProfileStaff,
      actions,
      formatPhone,
      formatDate,
      getRoleName,
    ]
  );
}

// 권한 체크 훅
export function useStaffPermissions(userId?: string, userRole?: string) {
  const isAdmin = useMemo(() => {
    return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  }, [userRole]);

  const canEdit = useCallback(
    (targetMember: Staff): boolean => {
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
      return targetMember.userId === userId;
    },
    [userId, userRole]
  );

  return useMemo(() => ({ isAdmin, canEdit }), [isAdmin, canEdit]);
}
