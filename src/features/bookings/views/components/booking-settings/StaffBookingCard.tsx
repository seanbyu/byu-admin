'use client';

import { memo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { Staff } from '@/features/staff/types';
import { Users, Calendar, GripVertical } from 'lucide-react';
import { StaffScheduleEditModal } from '../StaffScheduleEditModal';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { AccordionCardSkeleton } from '@/components/ui/Skeleton';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StaffBookingCardProps {
  salonId: string;
}

interface SortableStaffRowProps {
  staff: Staff;
  updatingStaffId: string | null;
  onToggle: (staffId: string, enabled: boolean) => void;
  onOpenSchedule: (staff: Staff) => void;
}

const SortableStaffRow = memo(function SortableStaffRow({
  staff,
  updatingStaffId,
  onToggle,
  onOpenSchedule,
}: SortableStaffRowProps) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: staff.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-secondary-50 rounded-lg transition-colors ${
        isDragging ? 'shadow-md ring-2 ring-primary-400 ring-offset-1' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* 드래그 핸들 — 터치/마우스 모두 지원 */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none text-secondary-400 hover:text-secondary-600 cursor-grab active:cursor-grabbing p-0.5"
          aria-label="drag handle"
        >
          <GripVertical size={16} />
        </button>

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenSchedule(staff)}
          className="flex items-center gap-1 h-7 text-xs px-2"
        >
          <Calendar size={12} />
          <span className="hidden sm:inline">{t('booking.settings.staffBooking.scheduleButton')}</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-secondary-500 hidden sm:inline">
            {t('booking.settings.staffBooking.bookingAllowed')}
          </span>
          <Switch
            checked={staff.isBookingEnabled}
            disabled={updatingStaffId === staff.id}
            onCheckedChange={(checked) => onToggle(staff.id, checked)}
          />
        </div>
      </div>
    </div>
  );
});

export const StaffBookingCard = memo(function StaffBookingCard({
  salonId,
}: StaffBookingCardProps) {
  const t = useTranslations();
  const toast = useToast();
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<Staff | null>(null);
  const [updatingStaffId, setUpdatingStaffId] = useState<string | null>(null);

  const { staffData, isLoading, updateStaff, updateDisplayOrder, refetch } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const staffList = staffData;

  // 터치 드래그와 스크롤을 구분하기 위해 distance: 5 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBookingToggle = useCallback(
    async (staffId: string, enabled: boolean) => {
      setUpdatingStaffId(staffId);
      try {
        await updateStaff({
          staffId,
          updates: { isBookingEnabled: enabled },
        });
        toast.success(
          enabled
            ? t('booking.settings.staffBooking.bookingEnabled')
            : t('booking.settings.staffBooking.bookingDisabled')
        );
      } catch {
        toast.error(t('common.error'));
      } finally {
        setUpdatingStaffId(null);
      }
    },
    [updateStaff, toast, t]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = staffList.findIndex((s) => s.id === active.id);
      const newIndex = staffList.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(staffList, oldIndex, newIndex);

      const staffOrders = reordered.map((staff, index) => ({
        staffId: staff.id,
        displayOrder: index,
      }));

      // Optimistic: onMutate에서 캐시가 즉시 업데이트되므로 토스트도 즉시 표시
      toast.success(t('booking.settings.staffBooking.orderSaved'));

      // 백그라운드 API 호출 — 실패 시에만 에러 토스트
      updateDisplayOrder(staffOrders).catch(() => {
        toast.error(t('common.error'));
      });
    },
    [staffList, updateDisplayOrder, toast, t]
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
    return <AccordionCardSkeleton />;
  }

  return (
    <>
      <Card padding="none" className="p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-secondary-600" />
            <h2 className="text-base font-semibold text-secondary-900">
              {t('booking.settings.staffBooking.title')}
            </h2>
          </div>
        </div>

        <p className="text-xs text-secondary-500 mb-3">
          {t('booking.settings.staffBooking.description')}
        </p>

        {staffList.length === 0 ? (
          <EmptyState
            message={t('booking.settings.staffBooking.noStaff')}
            size="sm"
            className="bg-secondary-50 rounded-lg"
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={staffList.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {staffList.map((staff) => (
                  <SortableStaffRow
                    key={staff.id}
                    staff={staff}
                    updatingStaffId={updatingStaffId}
                    onToggle={handleBookingToggle}
                    onOpenSchedule={handleOpenScheduleModal}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="mt-3 p-2.5 bg-primary-50 rounded-lg">
          <p className="text-xs text-primary-600">
            {t('booking.settings.staffBooking.orderHint')}
          </p>
        </div>
      </Card>

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
