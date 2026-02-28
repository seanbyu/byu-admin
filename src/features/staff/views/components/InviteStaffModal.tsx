'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase/client';
import { createStaff } from '@/features/staff/actions';
import { useUser } from '@/features/auth/hooks/useAuth';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteStaffModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteStaffModalProps) {
  const { data: user } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.salonId) {
        throw new Error('Salon ID not found. Please log in again.');
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to invite staff.');
      }

      const result = await createStaff({
        salonId: user.salonId,
        email,
        name,
        role,
        password: 'salon1234!', // Default password for invitations
        accessToken: session.access_token,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
      setRole('STAFF');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Invite New Staff" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error-50 text-error-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary-700"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-secondary-700"
          >
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-secondary-700"
          >
            Role
          </label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            showPlaceholder={false}
            options={[
              { value: 'STAFF', label: 'Staff' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          <p className="text-xs text-secondary-500">
            This determines their access level in the system.
          </p>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
