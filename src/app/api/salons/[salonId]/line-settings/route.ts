import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('salon_line_settings')
      .select('*')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        salonId: data.salon_id,
        lineChannelId: data.line_channel_id,
        lineChannelSecret: data.line_channel_secret,
        lineChannelAccessToken: data.line_channel_access_token,
        liffId: data.liff_id ?? '',
        isActive: data.is_active,
        isVerified: data.is_verified,
        lastVerifiedAt: data.last_verified_at,
        verificationError: data.verification_error,
      },
    });
  } catch (error: any) {
    console.error('LINE Settings GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let result;

    switch (action) {
      case 'upsert': {
        const { data: row, error } = await (supabase
          .from('salon_line_settings') as any)
          .upsert(
            {
              salon_id: salonId,
              line_channel_id: data.lineChannelId,
              line_channel_secret: data.lineChannelSecret,
              line_channel_access_token: data.lineChannelAccessToken,
              liff_id: data.liffId || null,
              is_active: true,
            },
            { onConflict: 'salon_id' }
          )
          .select()
          .single();

        if (error) throw new Error(error.message);
        result = {
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
        break;
      }

      case 'toggle_active': {
        const { error } = await (supabase
          .from('salon_line_settings') as any)
          .update({ is_active: data.isActive })
          .eq('salon_id', salonId);

        if (error) throw new Error(error.message);
        break;
      }

      case 'delete': {
        const { error: delError } = await supabase
          .from('salon_line_settings')
          .delete()
          .eq('salon_id', salonId);

        if (delError) throw new Error(delError.message);

        // salon.settings.contact_channels.line 제거
        const { data: salon } = await supabase
          .from('salons')
          .select('settings')
          .eq('id', salonId)
          .single() as { data: { settings: Record<string, unknown> } | null; error: unknown };

        if (salon?.settings) {
          const { contact_channels, ...restSettings } = salon.settings as any;
          const { line: _line, ...restChannels } = contact_channels || {};
          await (supabase.from('salons') as any)
            .update({
              settings: { ...restSettings, contact_channels: restChannels },
            })
            .eq('id', salonId);
        }
        break;
      }

      case 'verify': {
        // 1. 현재 LINE 설정 조회
        const { data: settings, error: getErr } = await supabase
          .from('salon_line_settings')
          .select('line_channel_access_token')
          .eq('salon_id', salonId)
          .single();

        if (getErr || !settings) {
          return NextResponse.json(
            { success: false, message: 'No LINE settings found' },
            { status: 404 }
          );
        }

        // 2. LINE Bot Info API 호출
        const lineRes = await fetch('https://api.line.me/v2/bot/info', {
          headers: { Authorization: `Bearer ${settings.line_channel_access_token}` },
        });
        const lineData = await lineRes.json();

        if (lineRes.ok) {
          // 3a. 검증 성공 — salon_line_settings 업데이트
          await (supabase.from('salon_line_settings') as any)
            .update({
              is_verified: true,
              last_verified_at: new Date().toISOString(),
              verification_error: null,
            })
            .eq('salon_id', salonId);

          // 3b. salon.settings.contact_channels.line 자동 설정
          const basicId = lineData?.basicId;
          if (basicId) {
            const { data: salon } = await supabase
              .from('salons')
              .select('settings')
              .eq('id', salonId)
              .single() as { data: { settings: Record<string, unknown> } | null; error: unknown };

            const currentSettings = (salon?.settings as any) || {};
            const contactChannels = currentSettings.contact_channels || {};
            await (supabase.from('salons') as any)
              .update({
                settings: {
                  ...currentSettings,
                  contact_channels: { ...contactChannels, line: { enabled: true, id: basicId } },
                },
              })
              .eq('id', salonId);
          }

          result = { success: true, botInfo: lineData };
        } else {
          const errorMsg = lineData?.message || `LINE API Error: ${lineRes.status}`;

          // 검증 실패 — salon_line_settings 업데이트
          await (supabase.from('salon_line_settings') as any)
            .update({ is_verified: false, verification_error: errorMsg })
            .eq('salon_id', salonId);

          result = { success: false, error: errorMsg };
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('LINE Settings POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
