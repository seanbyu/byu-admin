import { BaseRepository } from './base.repository';

export interface LineSettings {
  id: string;
  salonId: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  liffId: string;
  isActive: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationError: string | null;
}

interface DBLineSettingsRow {
  id: string;
  salon_id: string;
  line_channel_id: string;
  line_channel_secret: string;
  line_channel_access_token: string;
  liff_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
  verification_error: string | null;
}

function rowToLineSettings(row: DBLineSettingsRow): LineSettings {
  return {
    id: row.id,
    salonId: row.salon_id,
    lineChannelId: row.line_channel_id,
    lineChannelSecret: row.line_channel_secret,
    lineChannelAccessToken: row.line_channel_access_token,
    liffId: row.liff_id ?? '',
    isActive: row.is_active,
    isVerified: row.is_verified,
    lastVerifiedAt: row.last_verified_at,
    verificationError: row.verification_error,
  };
}

export class LineSettingsRepository extends BaseRepository {
  async getLineSettings(salonId: string): Promise<LineSettings | null> {
    const { data, error } = await (this.supabase as any)
      .from('salon_line_settings')
      .select('*')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToLineSettings(data as DBLineSettingsRow) : null;
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
    const { data, error } = await (this.supabase as any)
      .from('salon_line_settings')
      .upsert(
        {
          salon_id: salonId,
          line_channel_id: input.lineChannelId,
          line_channel_secret: input.lineChannelSecret,
          line_channel_access_token: input.lineChannelAccessToken,
          liff_id: input.liffId || null,
          is_active: true,
        },
        { onConflict: 'salon_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return rowToLineSettings(data as DBLineSettingsRow);
  }

  async toggleActive(salonId: string, isActive: boolean): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('salon_line_settings')
      .update({ is_active: isActive })
      .eq('salon_id', salonId);

    if (error) throw error;
  }

  async deleteLineSettings(salonId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('salon_line_settings')
      .delete()
      .eq('salon_id', salonId);

    if (error) throw error;

    // salon.settings.contact_channels.line 제거
    const { data: salon } = await (this.supabase as any)
      .from('salons')
      .select('settings')
      .eq('id', salonId)
      .single();

    if (salon?.settings) {
      const { contact_channels, ...restSettings } = salon.settings as Record<string, unknown> & { contact_channels?: Record<string, unknown> };
      const { line: _line, ...restChannels } = contact_channels || {};
      await (this.supabase as any)
        .from('salons')
        .update({ settings: { ...restSettings, contact_channels: restChannels } })
        .eq('id', salonId);
    }
  }

  async verifyLineToken(salonId: string): Promise<{ success: boolean; botInfo?: unknown; error?: string }> {
    const { data: settings, error } = await (this.supabase as any)
      .from('salon_line_settings')
      .select('line_channel_access_token')
      .eq('salon_id', salonId)
      .single();

    if (error || !settings) {
      throw Object.assign(new Error('No LINE settings found'), { status: 404 });
    }

    const lineRes = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${settings.line_channel_access_token}` },
    });
    const lineData = await lineRes.json();

    if (lineRes.ok) {
      await (this.supabase as any)
        .from('salon_line_settings')
        .update({
          is_verified: true,
          last_verified_at: new Date().toISOString(),
          verification_error: null,
        })
        .eq('salon_id', salonId);

      const basicId = lineData?.basicId;
      if (basicId) {
        const { data: salon } = await (this.supabase as any)
          .from('salons')
          .select('settings')
          .eq('id', salonId)
          .single();

        const currentSettings = salon?.settings || {};
        const contactChannels = currentSettings.contact_channels || {};
        await (this.supabase as any)
          .from('salons')
          .update({
            settings: {
              ...currentSettings,
              contact_channels: { ...contactChannels, line: { enabled: true, id: basicId } },
            },
          })
          .eq('id', salonId);
      }

      return { success: true, botInfo: lineData };
    } else {
      const errorMsg = lineData?.message || `LINE API Error: ${lineRes.status}`;
      await (this.supabase as any)
        .from('salon_line_settings')
        .update({ is_verified: false, verification_error: errorMsg })
        .eq('salon_id', salonId);

      return { success: false, error: errorMsg };
    }
  }
}
