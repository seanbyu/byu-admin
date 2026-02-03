'use client';

import { StaffBookingCard } from './settings';

interface StaffBookingSectionProps {
  salonId: string;
}

export function StaffBookingSection({ salonId }: StaffBookingSectionProps) {
  return <StaffBookingCard salonId={salonId} />;
}
