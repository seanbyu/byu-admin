import { Suspense } from 'react';
import BookingsPageView from '@/features/bookings/views/BookingsPageView';
import { Spinner } from '@/components/ui/Spinner';

export default function BookingChartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Spinner size="xl" />
        </div>
      }
    >
      <BookingsPageView isChart />
    </Suspense>
  );
}
