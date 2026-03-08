import { NotificationRepository, AdminNotification, BookingNotificationStatus } from '../repositories/notification.repository';
import { Client } from '../types';

export class NotificationPanelService {
  private repository: NotificationRepository;

  constructor(private client: Client) {
    this.repository = new NotificationRepository(this.client);
  }

  async getAdminNotifications(salonId: string, limit: number): Promise<AdminNotification[]> {
    return this.repository.getAdminNotifications(salonId, limit);
  }

  async countUnread(salonId: string): Promise<number> {
    return this.repository.countUnread(salonId);
  }

  async markAsRead(salonId: string, id?: string): Promise<void> {
    return this.repository.markAsRead(salonId, id);
  }

  async deleteNotification(salonId: string, id: string): Promise<void> {
    return this.repository.deleteNotification(salonId, id);
  }

  async getBookingNotificationStatuses(
    salonId: string,
    date: string
  ): Promise<Record<string, BookingNotificationStatus>> {
    return this.repository.getBookingNotificationStatuses(salonId, date);
  }
}

export type { AdminNotification, BookingNotificationStatus };
