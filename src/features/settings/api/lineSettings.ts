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

    // salon.settings.contact_channels.line 제거
    const { data: salon } = await supabase
      .from('salons')
      .select('settings')
      .eq('id', salonId)
      .single() as { data: { settings: Record<string, unknown> } | null; error: unknown };

    if (salon?.settings) {
      const currentSettings = salon.settings;
      const contactChannels = (currentSettings.contact_channels as Record<string, unknown>) || {};
      const { line: _, ...restChannels } = contactChannels;

      await (supabase.from('salons') as any)
        .update({
          settings: {
            ...currentSettings,
            contact_channels: restChannels,
          },
        })
        .eq('id', salonId);
    }
  },

  verify: async (salonId: string): Promise<{ success: boolean; error?: string }> => {
    // LINE API로 토큰 유효성 검증 (서버사이드 프록시 경유)
    console.log('[LINE Verify] 시작 - salonId:', salonId);
    const settings = await lineSettingsApi.get(salonId);
    console.log('[LINE Verify] settings 조회 결과:', settings ? { id: settings.id, isVerified: settings.isVerified, isActive: settings.isActive } : null);
    if (!settings) return { success: false, error: 'No LINE settings found' };

    try {
      console.log('[LINE Verify] /api/line/verify 호출 시작');
      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: settings.lineChannelAccessToken }),
      });

      const result = await response.json();
      console.log('[LINE Verify] API 응답:', { status: response.status, success: result.success, botInfo: result.botInfo, error: result.error });

      if (result.success) {
        console.log('[LINE Verify] 검증 성공 - salon_line_settings 업데이트 중...');
        await (supabase
          .from('salon_line_settings') as any)
          .update({
            is_verified: true,
            last_verified_at: new Date().toISOString(),
            verification_error: null,
          })
          .eq('salon_id', salonId);

        // 검증 성공 시 salon.settings.contact_channels.line 자동 설정
        const basicId = result.botInfo?.basicId;
        console.log('[LINE Verify] botInfo.basicId:', basicId);
        if (basicId) {
          const { data: salon } = await supabase
            .from('salons')
            .select('settings')
            .eq('id', salonId)
            .single() as { data: { settings: Record<string, unknown> } | null; error: unknown };

          console.log('[LINE Verify] 현재 salon.settings:', salon?.settings);
          const currentSettings = (salon?.settings) || {};
          const contactChannels = (currentSettings.contact_channels as Record<string, unknown>) || {};

          const newSettings = {
            ...currentSettings,
            contact_channels: {
              ...contactChannels,
              line: { enabled: true, id: basicId },
            },
          };
          console.log('[LINE Verify] 업데이트할 salon.settings:', newSettings);

          const updateResult = await (supabase.from('salons') as any)
            .update({ settings: newSettings })
            .eq('id', salonId);
          console.log('[LINE Verify] salon.settings 업데이트 결과:', updateResult);
        } else {
          console.warn('[LINE Verify] basicId가 없음 - contact_channels 업데이트 건너뜀');
        }

        return { success: true };
      }

      const errorMsg = result.error || `LINE API Error: ${response.status}`;
      console.error('[LINE Verify] 검증 실패:', errorMsg);
      await (supabase
        .from('salon_line_settings') as any)
        .update({
          is_verified: false,
          verification_error: errorMsg,
        })
        .eq('salon_id', salonId);

      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[LINE Verify] 예외 발생:', err);
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
