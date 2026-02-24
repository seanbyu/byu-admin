import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    console.log('[API /line/verify] 요청 수신 - accessToken 존재:', !!accessToken);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('[API /line/verify] LINE Bot Info API 호출 중...');
    const response = await fetch('https://api.line.me/v2/bot/info', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[API /line/verify] LINE API 응답 status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[API /line/verify] LINE Bot Info:', JSON.stringify(data));
      return NextResponse.json({ success: true, botInfo: data });
    }

    const errorText = await response.text();
    console.error('[API /line/verify] LINE API 에러:', response.status, errorText);
    return NextResponse.json(
      { success: false, error: `LINE API Error ${response.status}: ${errorText}` },
      { status: response.status }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /line/verify] 서버 예외:', err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
