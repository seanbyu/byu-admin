'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Staff } from '../types';

// 전화번호 포맷 정규식을 외부로 호이스팅 (js-hoist-regexp)
const PHONE_REGEX = /(\d{3})(\d{4})(\d{4})/;

// 역할 키 매핑
const ROLE_KEYS: Record<string, string> = {
  ADMIN: 'roles.admin',
  MANAGER: 'roles.manager',
  STAFF: 'roles.staff',
};

interface UseStaffPageStateReturn {
  // Modal states
  showInviteModal: boolean;
  selectedStaff: Staff | null;
  editingProfileStaff: Staff | null;
  // Actions
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editingProfileStaff, setEditingProfileStaff] = useState<Staff | null>(null);

  // Modal actions
  const openInviteModal = useCallback(() => {
    setShowInviteModal(true);
  }, []);

  const closeInviteModal = useCallback(() => {
    setShowInviteModal(false);
  }, []);

  const selectStaffForPermission = useCallback((staff: Staff) => {
    setSelectedStaff(staff);
  }, []);

  const clearSelectedStaff = useCallback(() => {
    setSelectedStaff(null);
  }, []);

  const selectStaffForProfileEdit = useCallback((staff: Staff) => {
    setEditingProfileStaff(staff);
  }, []);

  const clearEditingProfileStaff = useCallback(() => {
    setEditingProfileStaff(null);
  }, []);

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

  const getRoleName = useCallback((role?: string): string => {
    const key = ROLE_KEYS[role || ''] || 'roles.staff';
    return t(key);
  }, [t]);

  return {
    showInviteModal,
    selectedStaff,
    editingProfileStaff,
    openInviteModal,
    closeInviteModal,
    selectStaffForPermission,
    clearSelectedStaff,
    selectStaffForProfileEdit,
    clearEditingProfileStaff,
    formatPhone,
    formatDate,
    getRoleName,
  };
}

// 권한 체크 훅
export function useStaffPermissions(userId?: string, userRole?: string) {
  const isAdmin = useMemo(() => {
    return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  }, [userRole]);

  const canEdit = useCallback((targetMember: Staff): boolean => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    return targetMember.userId === userId;
  }, [userId, userRole]);

  return {
    isAdmin,
    canEdit,
  };
}
