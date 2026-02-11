import { NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram';

/**
 * GET /api/instagram/me
 * 현재 Instagram 사용자 정보 조회
 */
export async function GET() {
  try {
    const instagram = createInstagramClient();

    // 사용자 정보 조회
    const user = await instagram.getMe();

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Instagram Me API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch user info';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
