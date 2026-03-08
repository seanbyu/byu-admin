import { SettingsRepository, SalonSettings, FrontendBusinessHour, SalonInfo, UpdateSalonInfoDto } from '../repositories/settings.repository';
import { Client } from '../types';

export class SettingsService {
  private repository: SettingsRepository;

  constructor(private client: Client) {
    this.repository = new SettingsRepository(this.client);
  }

  async getSalonSettings(salonId: string): Promise<SalonSettings> {
    return this.repository.getSalonSettings(salonId);
  }

  async updateSalonSettings(
    salonId: string,
    updates: {
      businessHours?: FrontendBusinessHour[];
      holidays?: string[];
      settings?: Record<string, unknown>;
    }
  ): Promise<void> {
    return this.repository.updateSalonSettings(salonId, updates);
  }

  async uploadCoverImage(salonId: string, file: File): Promise<string> {
    return this.repository.uploadCoverImage(salonId, file);
  }

  async deleteCoverImage(salonId: string): Promise<void> {
    return this.repository.deleteCoverImage(salonId);
  }

  async getSalonInfo(salonId: string): Promise<SalonInfo> {
    return this.repository.getSalonInfo(salonId);
  }

  async updateSalonInfo(salonId: string, dto: UpdateSalonInfoDto): Promise<SalonInfo> {
    return this.repository.updateSalonInfo(salonId, dto);
  }
}

export type { SalonSettings, FrontendBusinessHour, SalonInfo, UpdateSalonInfoDto };
