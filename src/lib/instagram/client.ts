/**
 * Instagram Graph API Client
 */

import type {
  InstagramMedia,
  InstagramUser,
  InstagramMediaResponse,
  TokenRefreshResponse,
} from './types';

const INSTAGRAM_GRAPH_API_BASE = 'https://graph.instagram.com';

export class InstagramClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getMe(): Promise<InstagramUser> {
    const url = `${INSTAGRAM_GRAPH_API_BASE}/me?fields=id,username&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get user info');
    }

    return response.json();
  }

  /**
   * 미디어 목록 조회
   */
  async getMedia(limit: number = 25, after?: string): Promise<InstagramMediaResponse> {
    let url = `${INSTAGRAM_GRAPH_API_BASE}/me/media?fields=id,caption,media_url,media_type,timestamp,permalink,thumbnail_url&limit=${limit}&access_token=${this.accessToken}`;

    if (after) {
      url += `&after=${after}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get media');
    }

    return response.json();
  }

  /**
   * 특정 미디어 상세 조회
   */
  async getMediaById(mediaId: string): Promise<InstagramMedia> {
    const url = `${INSTAGRAM_GRAPH_API_BASE}/${mediaId}?fields=id,caption,media_url,media_type,timestamp,permalink,thumbnail_url&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get media');
    }

    return response.json();
  }

  /**
   * 여러 미디어 상세 조회
   */
  async getMediaByIds(mediaIds: string[]): Promise<InstagramMedia[]> {
    const promises = mediaIds.map(id => this.getMediaById(id));
    return Promise.all(promises);
  }

  /**
   * Long-lived 토큰 갱신
   * Long-lived 토큰은 60일마다 갱신 필요
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    const url = `${INSTAGRAM_GRAPH_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to refresh token');
    }

    return response.json();
  }
}

/**
 * 환경변수에서 Instagram 클라이언트 생성
 */
export function createInstagramClient(): InstagramClient {
  const accessToken = process.env.NEXT_PUBLIC_INSTARGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Instagram access token not configured');
  }

  return new InstagramClient(accessToken);
}
