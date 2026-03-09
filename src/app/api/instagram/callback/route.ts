import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';


const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;

/**
 * GET /api/instagram/callback
 * Instagram OAuth 콜백 처리
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');

    // 에러 처리
    if (error) {
      console.error('Instagram OAuth Error:', error, errorReason);
      const returnUrl = '/settings?instagram_error=' + encodeURIComponent(errorReason || error);
      return NextResponse.redirect(new URL(returnUrl, req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?instagram_error=no_code', req.url));
    }

    // State 디코딩
    let designerId: string | null = null;
    let returnUrl = '/settings';

    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        designerId = state.designerId;
        returnUrl = state.returnUrl || '/settings';
      } catch {
        console.error('Failed to parse state');
      }
    }

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.redirect(
        new URL('/settings?instagram_error=not_configured', req.url)
      );
    }

    // Short-lived 토큰 교환
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        new URL('/settings?instagram_error=token_exchange_failed', req.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // Long-lived 토큰으로 교환
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`
    );

    if (!longLivedResponse.ok) {
      console.error('Long-lived token exchange error');
      return NextResponse.redirect(
        new URL('/settings?instagram_error=long_lived_token_failed', req.url)
      );
    }

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // 초 단위

    // DB에 토큰 저장 (디자이너 ID가 있는 경우)
    if (designerId) {
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      await supabase
        .from('designer_instagram_tokens')
        .upsert({
          designer_id: designerId,
          instagram_user_id: userId.toString(),
          access_token: longLivedToken,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'designer_id',
        });
    }

    // 성공 리다이렉트
    const successUrl = new URL(returnUrl, req.url);
    successUrl.searchParams.set('instagram_connected', 'true');

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Instagram Callback Error:', error);
    return NextResponse.redirect(
      new URL('/settings?instagram_error=callback_failed', req.url)
    );
  }
}
