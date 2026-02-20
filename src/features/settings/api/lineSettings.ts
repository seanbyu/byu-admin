import { supabase } from '@/lib/supabase/client';

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

interface LineSettingsRow {
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

function toLineSettings(row: LineSettingsRow): LineSettings {
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

export const lineSettingsApi = {
  get: async (salonId: string): Promise<LineSettings | null> => {
    const { data, error } = await supabase
      .from('salon_line_settings')
      .select('*')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return toLineSettings(data as LineSettingsRow);
  },

  upsert: async (
    salonId: string,
    settings: {
      lineChannelId: string;
      lineChannelSecret: string;
      lineChannelAccessToken: string;
      liffId?: string;
    }
  ): Promise<LineSettings> => {
    const { data, error } = await (supabase
      .from('salon_line_settings') as any)
      .upsert(
        {
          salon_id: salonId,
          line_channel_id: settings.lineChannelId,
          line_channel_secret: settings.lineChannelSecret,
          line_channel_access_token: settings.lineChannelAccessToken,
          liff_id: settings.liffId || null,
          is_active: true,
        },
        { onConflict: 'salon_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return toLineSettings(data as LineSettingsRow);
  },

  toggleActive: async (salonId: string, isActive: boolean): Promise<void> => {
    const { error } = await (supabase
      .from('salon_line_settings') as any)
      .update({ is_active: isActive })
      .eq('salon_id', salonId);

    if (error) throw error;
  },

  delete: async (salonId: string): Promise<void> => {
    const { error } = await supabase
      .from('salon_line_settings')
      .delete()
      .eq('salon_id', salonId);

    if (error) throw error;
  },

  verify: async (salonId: string): Promise<{ success: boolean; error?: string }> => {
    // LINE API로 토큰 유효성 검증
    const settings = await lineSettingsApi.get(salonId);
    if (!settings) return { success: false, error: 'No LINE settings found' };

    try {
      const response = await fetch('https://api.line.me/v2/bot/info', {
        headers: {
          Authorization: `Bearer ${settings.lineChannelAccessToken}`,
        },
      });

      if (response.ok) {
        await (supabase
          .from('salon_line_settings') as any)
          .update({
            is_verified: true,
            last_verified_at: new Date().toISOString(),
            verification_error: null,
          })
          .eq('salon_id', salonId);

        return { success: true };
      }

      const errorText = await response.text();
      await (supabase
        .from('salon_line_settings') as any)
        .update({
          is_verified: false,
          verification_error: `API Error ${response.status}: ${errorText}`,
        })
        .eq('salon_id', salonId);

      return { success: false, error: `LINE API Error: ${response.status}` };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await (supabase
        .from('salon_line_settings') as any)
        .update({
          is_verified: false,
          verification_error: errorMsg,
        })
        .eq('salon_id', salonId);

      return { success: false, error: errorMsg };
    }
  },
};
