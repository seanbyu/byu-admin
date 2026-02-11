import { NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram';

/**
 * POST /api/instagram/refresh-token
 * Instagram Long-lived 토큰 갱신
 *
 * 참고: Long-lived 토큰은 60일마다 갱신 필요
 * CRON job으로 주기적 호출 권장
 */
export async function POST() {
  try {
    const instagram = createInstagramClient();

    // 토큰 갱신
    const result = await instagram.refreshToken();

    // 실제 운영환경에서는 새 토큰을 DB나 환경변수에 저장해야 함
    console.log('Token refreshed, expires in:', result.expires_in, 'seconds');

    return NextResponse.json({
      success: true,
      data: {
        expiresIn: result.expires_in,
        tokenType: result.token_type,
        // 보안을 위해 토큰 자체는 반환하지 않음
        message: 'Token refreshed successfully. New token expires in ' +
                 Math.round(result.expires_in / 86400) + ' days.',
      },
    });
  } catch (error) {
    console.error('Instagram Refresh Token API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to refresh token';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
