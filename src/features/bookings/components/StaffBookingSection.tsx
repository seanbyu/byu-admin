'use client';

import { memo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { Staff } from '@/features/staff/types';
import { Check, Users, Calendar } from 'lucide-react';
import { StaffScheduleEditModal } from './StaffScheduleEditModal';

interface StaffBookingSectionProps {
  salonId: string;
}

export const StaffBookingSection = memo(function StaffBookingSection({
  salonId,
}: StaffBookingSectionProps) {
  const t = useTranslations();
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<Staff | null>(null);

  const { data: staffResponse, isLoading, updateStaff, isUpdating, refetch } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const staffList = staffResponse?.data || [];

  const handleBookingToggle = useCallback(
    async (staffId: string, enabled: boolean) => {
      try {
        await updateStaff({
          staffId,
          updates: { isBookingEnabled: enabled },
        });
        setSaveSuccess(staffId);
        setTimeout(() => setSaveSuccess(null), 2000);
      } catch (error) {
        console.error('Failed to update booking status:', error);
      }
    },
    [updateStaff]
  );

  const handleOpenScheduleModal = useCallback((staff: Staff) => {
    setSelectedStaffForSchedule(staff);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    setSelectedStaffForSchedule(null);
  }, []);

  const handleScheduleSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users size={20} className="text-secondary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">
            {t('booking.settings.staffBooking.title')}
          </h2>
        </div>

        <p className="text-sm text-secondary-600 mb-4">
          {t('booking.settings.staffBooking.description')}
        </p>

        {staffList.length === 0 ? (
          <div className="text-center py-8 text-secondary-500 bg-secondary-50 rounded-lg">
            {t('booking.settings.staffBooking.noStaff')}
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {staff.profileImage ? (
                    <img
                      src={staff.profileImage}
                      alt={staff.name}
                      className="w-10 h-10 rounded-full object-cover border border-secondary-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-500 text-sm font-medium">
                      {staff.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-secondary-900">{staff.name}</div>
                    {staff.positionTitle && (
                      <div className="text-xs text-secondary-500">{staff.positionTitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 스케줄 설정 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenScheduleModal(staff)}
                    className="flex items-center gap-1"
                  >
                    <Calendar size={14} />
                    <span className="hidden sm:inline">{t('booking.settings.staffBooking.scheduleButton')}</span>
                  </Button>

                  {/* 예약 허용 토글 */}
                  <div className="flex items-center gap-2">
                    {saveSuccess === staff.id && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check size={14} />
                      </span>
                    )}
                    <span className="text-sm text-secondary-600 hidden sm:inline">
                      {t('booking.settings.staffBooking.bookingAllowed')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={staff.isBookingEnabled}
                        disabled={isUpdating}
                        onChange={(e) => handleBookingToggle(staff.id, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            {t('booking.settings.staffBooking.hint')}
          </p>
        </div>
      </Card>

      {/* 스케줄 편집 모달 */}
      {selectedStaffForSchedule && (
        <StaffScheduleEditModal
          isOpen={!!selectedStaffForSchedule}
          onClose={handleCloseScheduleModal}
          staff={selectedStaffForSchedule}
          salonId={salonId}
          onSave={handleScheduleSaved}
        />
      )}
    </>
  );
});
