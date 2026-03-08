import { LineSettingsRepository, LineSettings } from '../repositories/line-settings.repository';
import { Client } from '../types';

export class LineSettingsService {
  private repository: LineSettingsRepository;

  constructor(private client: Client) {
    this.repository = new LineSettingsRepository(this.client);
  }

  async getLineSettings(salonId: string): Promise<LineSettings | null> {
    return this.repository.getLineSettings(salonId);
  }

  async upsertLineSettings(
    salonId: string,
    input: {
      lineChannelId: string;
      lineChannelSecret: string;
      lineChannelAccessToken: string;
      liffId?: string;
    }
  ): Promise<LineSettings> {
    return this.repository.upsertLineSettings(salonId, input);
  }

  async toggleActive(salonId: string, isActive: boolean): Promise<void> {
    return this.repository.toggleActive(salonId, isActive);
  }

  async deleteLineSettings(salonId: string): Promise<void> {
    return this.repository.deleteLineSettings(salonId);
  }

  async verifyLineToken(salonId: string): Promise<{ success: boolean; botInfo?: unknown; error?: string }> {
    return this.repository.verifyLineToken(salonId);
  }
}

export type { LineSettings };
