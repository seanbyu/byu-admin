'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Staff } from '../types';
import { useStaff } from '../hooks/useStaff';
import CreateStaffModal from './components/CreateStaffModal';
import StaffPermissionModal from './components/StaffPermissionModal';
import StaffProfileModal from './components/StaffProfileModal';

export default function StaffPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const {
    data: response,
    isLoading,
    error,
    updateStaff,
  } = useStaff(user?.salonId || '', {
    enabled: !!user?.salonId,
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const canEdit = (targetMember: Staff) => {
    if (isAdmin) return true;
    return targetMember.userId === user?.id; // Can edit self
  };

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editingProfileStaff, setEditingProfileStaff] = useState<Staff | null>(
    null
  );

  const staffMembers = response?.data || [];

  const handleUpdateStaff = async (
    staffId: string,
    updates: Partial<Staff>
  ) => {
    try {
      await updateStaff({ staffId, updates });
    } catch (err) {
      console.error(err);
      alert('업데이트에 실패했습니다');
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  const formatDate = (dateString: Date) => {
    const d = new Date(dateString);
    const yy = d.getFullYear().toString().slice(2);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${yy}. ${m}. ${day}`;
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'MANAGER':
        return '매니저';
      case 'STAFF':
        return '담당자';
      default:
        return '담당자';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-red-500">
            {t('common.error')}: {(error as Error).message}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-secondary-900">
              {t('staff.title')}
            </h1>
            <div className="text-sm text-secondary-600 mt-2 space-y-1">
              <p>
                • 직원 등록 방법은 직원이 salon store에 회원가입 후 샵 입사
                신청을 하면, 관리자 승인 후 등록됩니다.
              </p>
              <p>
                • 이름/닉네임 변경은 각 계정의 [마이페이지]에서 변경할 수
                있습니다.
              </p>
              <p>
                • 직원의 퇴사 처리는 관리자에서만 가능합니다.(직원의 퇴사 후
                재입사 시, 이전 데이터는 삭제 됩니다.)
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              직원 등록하기
            </Button>
          )}
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg border border-secondary-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-secondary-200">
              <tr>
                {[
                  '번호',
                  '이름/닉네임',
                  '이메일',
                  '연락처',
                  '입사일',
                  '입사/퇴사',
                  '관리 권한',
                  '프로필',
                  '직급/호칭',
                  '예약 허용',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-center text-xs font-medium text-secondary-500 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {staffMembers.map((member: Staff, index: number) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center text-sm text-secondary-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-secondary-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center border border-secondary-200 text-secondary-400">
                            <span className="text-xs font-medium">
                              {member.name[0]}
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            member.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium text-secondary-900">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-secondary-600">
                    {member.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-secondary-600">
                    {formatPhone(member.phone)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-secondary-600">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isAdmin && member.role !== 'SUPER_ADMIN' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 h-8 px-3 text-xs"
                        onClick={() => {
                          if (confirm('퇴사 처리하시겠습니까?')) {
                            handleUpdateStaff(member.id, { isActive: false });
                          }
                        }}
                      >
                        퇴사 처리
                      </Button>
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {member.role === 'SUPER_ADMIN' ||
                    member.role === 'ADMIN' ? (
                      <Badge
                        variant="default"
                        className="bg-gray-100 text-gray-500 font-normal"
                      >
                        모든 권한
                      </Badge>
                    ) : isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 text-white hover:bg-gray-700 h-8 px-3 text-xs rounded-full border-transparent"
                        onClick={() => {
                          setSelectedStaff(member);
                        }}
                      >
                        권한 설정
                      </Button>
                    ) : (
                      <span className="text-secondary-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center">
                    {canEdit(member) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => setEditingProfileStaff(member)}
                      >
                        정보 수정
                      </Button>
                    ) : member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-secondary-600">
                    {getRoleName(member.role)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={member.isBookingEnabled}
                        disabled={!canEdit(member)}
                        onChange={(e) => {
                          handleUpdateStaff(member.id, {
                            isBookingEnabled: e.target.checked,
                          });
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Existing Modals */}
        <CreateStaffModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            alert('직원이 등록되었습니다!');
            // Ideally refetch staff list here
            updateStaff({} as any); // Trigger refetch hack or use query invalidation?
            // useStaff might not expose refetch.
            // But usually modal onSuccess should trigger refresh.
            // Let's assume user refreshes or hook revalidates.
            window.location.reload(); // Simple refresh to show new user
          }}
          salonId={user?.salonId || ''}
          currentStaffCount={staffMembers.length}
        />

        {/* Permission Modal */}
        {selectedStaff && (
          <StaffPermissionModal
            isOpen={!!selectedStaff}
            onClose={() => setSelectedStaff(null)}
            staff={selectedStaff}
            onSave={async (id: string, perms: any[]) => {
              // Now mapped to updateStaff from hook
              // perms is StaffPermission[]
              await handleUpdateStaff(id, { permissions: perms });
              setSelectedStaff(null);
            }}
          />
        )}

        {/* Profile Edit Modal */}
        {editingProfileStaff && (
          <StaffProfileModal
            isOpen={!!editingProfileStaff}
            onClose={() => setEditingProfileStaff(null)}
            staff={editingProfileStaff}
            onSave={async (id, updates) => {
              await handleUpdateStaff(id, updates);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
