import { BaseRepository } from './base.repository';

export interface AdminNotification {
  id: string;
  title: string | null;
  body: string | null;
  notification_type: string;
  status: string;
  created_at: string;
  read_at: string | null;
  booking_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BookingNotificationStatus {
  confirmed: boolean;
  reminded: boolean;
}

export class NotificationRepository extends BaseRepository {
  async getAdminNotifications(salonId: string, limit: number): Promise<AdminNotification[]> {
    const { data, error } = await (this.supabase as any)
      .from('notifications')
      .select('id, title, body, notification_type, status, created_at, read_at, booking_id, metadata')
      .eq('salon_id', salonId)
      .eq('recipient_type', 'ADMIN')
      .eq('channel', 'IN_APP')
      .neq('status', 'FAILED')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as AdminNotification[];
  }

  async countUnread(salonId: string): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .eq('recipient_type', 'ADMIN')
      .eq('channel', 'IN_APP')
      .neq('status', 'FAILED')
      .is('read_at', null);

    if (error) throw error;
    return count ?? 0;
  }

  async markAsRead(salonId: string, id?: string): Promise<void> {
    const readAt = new Date().toISOString();
    let query = (this.supabase as any)
      .from('notifications')
      .update({ read_at: readAt })
      .eq('salon_id', salonId)
      .eq('channel', 'IN_APP')
      .is('read_at', null);

    if (id) {
      query = query.eq('id', id);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async deleteNotification(salonId: string, id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('salon_id', salonId);

    if (error) throw error;
  }

  async getBookingNotificationStatuses(
    salonId: string,
    date: string
  ): Promise<Record<string, BookingNotificationStatus>> {
    // idempotency_key의 날짜는 트리거 실행 시점(NOW())으로, 예약 날짜와 다를 수 있음
    // → 해당 날짜의 booking_id를 먼저 조회한 뒤, booking_id 기준으로 outbox 조회
    const { data: bookingData, error: bookingError } = await (this.supabase as any)
      .from('bookings')
      .select('id')
      .eq('salon_id', salonId)
      .eq('booking_date', date);

    if (bookingError) throw bookingError;

    const bookingIds = ((bookingData ?? []) as Array<{ id: string }>).map((b) => b.id);
    if (bookingIds.length === 0) return {};

    const { data, error } = await (this.supabase as any)
      .from('notification_outbox')
      .select('booking_id, notification_type, status')
      .eq('salon_id', salonId)
      .eq('channel', 'LINE')
      .in('notification_type', ['BOOKING_CONFIRMED', 'BOOKING_MODIFIED', 'BOOKING_REMINDER'])
      .in('booking_id', bookingIds)
      .in('status', ['sent', 'pending', 'sending']);

    if (error) throw error;

    const statusMap: Record<string, BookingNotificationStatus> = {};
    for (const row of (data ?? []) as Array<{ booking_id: string | null; notification_type: string; status: string }>) {
      if (!row.booking_id) continue;
      if (!statusMap[row.booking_id]) {
        statusMap[row.booking_id] = { confirmed: false, reminded: false };
      }
      if (row.notification_type === 'BOOKING_CONFIRMED' || row.notification_type === 'BOOKING_MODIFIED') {
        if (row.status === 'sent') statusMap[row.booking_id].confirmed = true;
      }
      if (row.notification_type === 'BOOKING_REMINDER') {
        statusMap[row.booking_id].reminded = row.status === 'sent';
      }
    }

    return statusMap;
  }
}
