'use client';

import { memo, useCallback, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { Staff } from '@/features/staff/types';
import { Check, Users, Calendar, GripVertical } from 'lucide-react';
import { StaffScheduleEditModal } from '../StaffScheduleEditModal';

interface StaffBookingCardProps {
  salonId: string;
}

export const StaffBookingCard = memo(function StaffBookingCard({
  salonId,
}: StaffBookingCardProps) {
  const t = useTranslations();
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<Staff | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { staffData, isLoading, updateStaff, updateDisplayOrder, isUpdating, isUpdatingOrder, refetch } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const staffList = staffData;
  const dragItemRef = useRef<number | null>(null);

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

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragItemRef.current !== index) {
      setDragOverIndex(index);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = dragItemRef.current;

      if (dragIndex === null || dragIndex === dropIndex) {
        handleDragEnd();
        return;
      }

      // Create new order
      const newList = [...staffList];
      const [draggedItem] = newList.splice(dragIndex, 1);
      newList.splice(dropIndex, 0, draggedItem);

      // Create staffOrders array with new display order
      const staffOrders = newList.map((staff, index) => ({
        staffId: staff.id,
        displayOrder: index,
      }));

      try {
        await updateDisplayOrder(staffOrders);
        setSaveSuccess('order');
        setTimeout(() => setSaveSuccess(null), 2000);
      } catch (error) {
        console.error('Failed to update display order:', error);
      }

      handleDragEnd();
    },
    [staffList, updateDisplayOrder, handleDragEnd]
  );

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
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-secondary-600" />
            <h2 className="text-base font-semibold text-secondary-900">
              {t('booking.settings.staffBooking.title')}
            </h2>
          </div>
          {saveSuccess === 'order' && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={14} />
              <span className="text-xs">{t('common.saved')}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-secondary-500 mb-3">
          {t('booking.settings.staffBooking.description')}
        </p>

        {staffList.length === 0 ? (
          <div className="text-center py-6 text-sm text-secondary-500 bg-secondary-50 rounded-lg">
            {t('booking.settings.staffBooking.noStaff')}
          </div>
        ) : (
          <div className="space-y-2">
            {staffList.map((staff, index) => (
              <div
                key={staff.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center justify-between p-3 bg-secondary-50 rounded-lg transition-all cursor-move ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-primary-400 ring-offset-1' : ''
                } ${isUpdatingOrder ? 'pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Drag handle */}
                  <div className="text-secondary-400 hover:text-secondary-600 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>

                  {staff.profileImage ? (
                    <img
                      src={staff.profileImage}
                      alt={staff.name}
                      className="w-8 h-8 rounded-full object-cover border border-secondary-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-500 text-xs font-medium">
                      {staff.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-secondary-900">{staff.name}</div>
                    {staff.positionTitle && (
                      <div className="text-xs text-secondary-400">{staff.positionTitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 스케줄 설정 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenScheduleModal(staff)}
                    className="flex items-center gap-1 h-7 text-xs px-2"
                  >
                    <Calendar size={12} />
                    <span className="hidden sm:inline">{t('booking.settings.staffBooking.scheduleButton')}</span>
                  </Button>

                  {/* 예약 허용 토글 */}
                  <div className="flex items-center gap-1.5">
                    {saveSuccess === staff.id && (
                      <Check size={12} className="text-green-600" />
                    )}
                    <span className="text-xs text-secondary-500 hidden sm:inline">
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
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600">
            {t('booking.settings.staffBooking.orderHint')}
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
