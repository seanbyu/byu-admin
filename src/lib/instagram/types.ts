/**
 * Instagram API Types
 */

// Instagram 미디어 타입
export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

// Instagram 미디어 응답
export interface InstagramMedia {
  id: string;
  caption?: string;
  media_url: string;
  media_type: InstagramMediaType;
  timestamp: string;
  permalink?: string;
  thumbnail_url?: string; // VIDEO 타입의 경우
}

// Instagram 사용자 정보
export interface InstagramUser {
  id: string;
  username: string;
}

// Instagram API 응답 (페이징)
export interface InstagramMediaResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

// 미디어 임포트 요청
export interface ImportMediaRequest {
  mediaIds: string[];
  designerId: string;
}

// 임포트된 포트폴리오 아이템
export interface PortfolioItem {
  id: string;
  designerId: string;
  sourceType: 'instagram' | 'manual';
  sourceId?: string; // Instagram media ID
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  tags?: string[];
  displayOrder: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// 토큰 갱신 응답
export interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// OAuth 상태
export interface OAuthState {
  designerId: string;
  redirectUrl: string;
}
