'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { createStaff } from '@/actions/staff';
import { Eye, EyeOff } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: string;
  currentStaffCount: number;
}

export default function CreateStaffModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  currentStaffCount,
}: CreateStaffModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [password, setPassword] = useState('salon1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FREE_STAFF = 5;
  const isLimitReached = currentStaffCount >= MAX_FREE_STAFF;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('직원을 등록하려면 로그인해야 합니다.');
      }

      const result = await createStaff({
        salonId,
        email,
        name,
        role,
        password,
        accessToken: session.access_token,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setRole('STAFF');
      setPassword('salon1234!');
    } catch (err: any) {
      if (
        err.message?.includes('User from sub claim') ||
        err.message?.toLowerCase().includes('unauthorized')
      ) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="직원 등록 (직접 생성)"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
          <p className="font-semibold">
            현재 직원 수: {currentStaffCount} / {MAX_FREE_STAFF}
          </p>
          {isLimitReached ? (
            <p className="text-red-600 mt-1">
              무료 플랜의 제한 인원에 도달했습니다.
            </p>
          ) : (
            <p className="mt-1">
              관리자가 아이디와 비밀번호를 직접 생성하여 직원에게 전달하는
              방식입니다.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            직원 아이디 (4~20자 영문 소문자, 숫자)
          </label>
          <input
            id="email"
            type="text"
            required
            value={email}
            onChange={(e) => {
              // Allow lower case alphanumeric only
              const val = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
              setEmail(val);
            }}
            pattern="^[a-z0-9]{4,20}$"
            title="4~20자의 영문 소문자와 숫자만 사용 가능합니다."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="staff01"
            disabled={isLimitReached}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
              placeholder="비밀번호 설정"
              disabled={isLimitReached}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500">기본 비밀번호: salon1234!</p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            이름
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="홍길동"
            disabled={isLimitReached}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            역할
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLimitReached}
          >
            <option value="STAFF">직원 (Staff)</option>
            <option value="MANAGER">매니저 (Manager)</option>
            <option value="ADMIN">관리자 (Admin)</option>
          </select>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || isLimitReached}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? '생성 중...' : '계정 생성'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
