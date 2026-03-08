import { BaseRepository } from './base.repository';

export interface DBBusinessHoursEntry {
  enabled: boolean;
  open: string | null;
  close: string | null;
}

export interface DBBusinessHours {
  [day: string]: DBBusinessHoursEntry;
}

export interface FrontendBusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface SalonInfo {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  googleMapUrl: string;
  imageUrl: string;
  phone: string;
  email: string;
  description: string;
  instagramUrl: string;
}

export interface UpdateSalonInfoDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  instagramUrl?: string;
}

export interface SalonSettings {
  businessHours: FrontendBusinessHour[];
  holidays: string[];
  settings: Record<string, unknown> | null;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function transformFromDB(dbHours: DBBusinessHours | null): FrontendBusinessHour[] {
  if (!dbHours) {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '10:00',
      closeTime: '20:00',
      isOpen: i !== 0,
    }));
  }

  return Object.entries(dbHours)
    .map(([day, value]) => ({
      dayOfWeek: DAY_MAP[day] ?? 0,
      openTime: value.open || '10:00',
      closeTime: value.close || '20:00',
      isOpen: value.enabled ?? false,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function transformToDB(frontendHours: FrontendBusinessHour[]): DBBusinessHours {
  const result: DBBusinessHours = {};
  frontendHours.forEach((hour) => {
    const dayName = DAY_NAMES[hour.dayOfWeek];
    result[dayName] = {
      enabled: hour.isOpen,
      open: hour.isOpen ? hour.openTime : null,
      close: hour.isOpen ? hour.closeTime : null,
    };
  });
  return result;
}

const BUCKET_NAME = 'salon-images';

function rowToSalonInfo(data: Record<string, unknown>): SalonInfo {
  const settings = (data.settings as Record<string, unknown>) ?? {};
  return {
    id: data.id as string,
    name: (data.name as string) ?? '',
    ownerName: '',
    address: (data.address as string) ?? '',
    googleMapUrl: '',
    imageUrl: (data.cover_image_url as string) ?? '',
    phone: (data.phone as string) ?? '',
    email: (data.email as string) ?? '',
    description: (data.description as string) ?? '',
    instagramUrl: (settings.instagram_url as string) ?? '',
  };
}

export class SettingsRepository extends BaseRepository {
  async getSalonInfo(salonId: string): Promise<SalonInfo> {
    const { data, error } = await (this.supabase as any)
      .from('salons')
      .select('id, name, description, address, phone, email, cover_image_url, settings')
      .eq('id', salonId)
      .single();

    if (error) throw error;
    return rowToSalonInfo(data);
  }

  async updateSalonInfo(salonId: string, dto: UpdateSalonInfoDto): Promise<SalonInfo> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.address !== undefined) updates.address = dto.address;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.description !== undefined) updates.description = dto.description;

    if (dto.instagramUrl !== undefined) {
      const { data: current } = await (this.supabase as any)
        .from('salons')
        .select('settings')
        .eq('id', salonId)
        .single();

      updates.settings = {
        ...((current?.settings as Record<string, unknown>) ?? {}),
        instagram_url: dto.instagramUrl,
      };
    }

    const { data, error } = await (this.supabase as any)
      .from('salons')
      .update(updates)
      .eq('id', salonId)
      .select('id, name, description, address, phone, email, cover_image_url, settings')
      .single();

    if (error) throw error;
    return rowToSalonInfo(data);
  }


  async uploadCoverImage(salonId: string, file: File): Promise<string> {
    const { data: buckets } = await (this.supabase as any).storage.listBuckets();
    const bucketExists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error } = await (this.supabase as any).storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
      if (error && !error.message.includes('already exists')) throw error;
    }

    const { data: existing } = await (this.supabase as any)
      .from('salons')
      .select('cover_image_url')
      .eq('id', salonId)
      .single();

    if (existing?.cover_image_url) {
      const urlParts = existing.cover_image_url.split(`${BUCKET_NAME}/`);
      if (urlParts[1]) {
        await (this.supabase as any).storage.from(BUCKET_NAME).remove([urlParts[1]]);
      }
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${salonId}/cover/image.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await (this.supabase as any).storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = (this.supabase as any).storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    const { error: updateError } = await (this.supabase as any)
      .from('salons')
      .update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', salonId);

    if (updateError) throw updateError;

    return imageUrl;
  }

  async deleteCoverImage(salonId: string): Promise<void> {
    const { data: salon, error: fetchError } = await (this.supabase as any)
      .from('salons')
      .select('cover_image_url')
      .eq('id', salonId)
      .single();

    if (fetchError) throw Object.assign(new Error('Salon not found'), { status: 404 });

    if (salon?.cover_image_url) {
      const urlParts = salon.cover_image_url.split(`${BUCKET_NAME}/`);
      if (urlParts[1]) {
        await (this.supabase as any).storage.from(BUCKET_NAME).remove([urlParts[1]]);
      }
    }

    const { error: updateError } = await (this.supabase as any)
      .from('salons')
      .update({ cover_image_url: null, updated_at: new Date().toISOString() })
      .eq('id', salonId);

    if (updateError) throw updateError;
  }


  async getSalonSettings(salonId: string): Promise<SalonSettings> {
    const { data, error } = await (this.supabase as any)
      .from('salons')
      .select('id, business_hours, holidays, settings')
      .eq('id', salonId)
      .single();

    if (error) throw error;

    return {
      businessHours: transformFromDB(data.business_hours),
      holidays: data.holidays || [],
      settings: data.settings,
    };
  }

  async updateSalonSettings(
    salonId: string,
    updates: {
      businessHours?: FrontendBusinessHour[];
      holidays?: string[];
      settings?: Record<string, unknown>;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.businessHours) {
      dbUpdates.business_hours = transformToDB(updates.businessHours);
    }

    if (updates.holidays !== undefined) {
      dbUpdates.holidays = updates.holidays;
    }

    if (updates.settings) {
      const { data: current } = await (this.supabase as any)
        .from('salons')
        .select('settings')
        .eq('id', salonId)
        .single();

      dbUpdates.settings = { ...(current?.settings || {}), ...updates.settings };
    }

    const { error } = await (this.supabase as any)
      .from('salons')
      .update(dbUpdates)
      .eq('id', salonId);

    if (error) throw error;
  }
}
