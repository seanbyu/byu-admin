import { NextRequest, NextResponse } from 'next/server';

/**
 * Instagram OAuth 설정
 * https://developers.facebook.com/docs/instagram-basic-display-api/getting-started
 */
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;

/**
 * GET /api/instagram/auth
 * Instagram OAuth 시작 - 인증 페이지로 리다이렉트
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const designerId = searchParams.get('designerId');
    const returnUrl = searchParams.get('returnUrl') || '/settings';

    if (!INSTAGRAM_APP_ID) {
      return NextResponse.json(
        { success: false, message: 'Instagram App ID not configured' },
        { status: 500 }
      );
    }

    // State에 정보 저장 (콜백에서 사용)
    const state = Buffer.from(JSON.stringify({
      designerId,
      returnUrl,
    })).toString('base64');

    // Instagram OAuth URL 생성
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
    authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'user_profile,user_media');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Instagram Auth Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to start OAuth';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
