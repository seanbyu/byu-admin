import { ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// API 에러 클래스
export class ApiError extends Error {
  errorCode?: string;
  status?: number;

  constructor(message: string, errorCode?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.status = status;
  }
}

// 에러 타입 가드
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// 에러에서 메시지 추출
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// 에러에서 에러코드 추출
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.errorCode;
  }
  return undefined;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }

    return session?.access_token ?? null;
  }

  private async buildHeaders(
    rawHeaders: HeadersInit | undefined,
    addJsonContentType: boolean
  ): Promise<Headers> {
    const headers = new Headers(rawHeaders);
    const token = await this.getAccessToken();

    if (addJsonContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return text ? { message: text } : {};
  }

  private shouldRetryWithRefresh(status: number, data: any): boolean {
    if (status !== 401) return false;

    const message = String(data?.error || data?.message || '').toLowerCase();
    const code = String(data?.errorCode || '').toLowerCase();

    return (
      message.includes('jwt expired') ||
      code === 'jwt_expired' ||
      code === 'token_expired'
    );
  }

  private async tryRefreshSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session?.access_token) {
      useAuthStore.getState().logout();
      return false;
    }

    useAuthStore.getState().setToken(data.session.access_token);
    return true;
  }

  private async performRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    hasRetried = false,
    addJsonContentType = true
  ): Promise<ApiResponse<T>> {
    const headers = await this.buildHeaders(options.headers, addJsonContentType);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await this.parseResponse(response);

    if (!response.ok) {
      if (!hasRetried && this.shouldRetryWithRefresh(response.status, data)) {
        const refreshed = await this.tryRefreshSession();
        if (refreshed) {
          return this.performRequest<T>(
            endpoint,
            options,
            true,
            addJsonContentType
          );
        }
      }

      throw new ApiError(
        data?.error || data?.message || 'An error occurred',
        data?.errorCode,
        response.status
      );
    }

    return data as ApiResponse<T>;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      return this.performRequest<T>(endpoint, options);
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>
          )
        ).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST request
  async post<T, D = unknown>(
    endpoint: string,
    data?: D
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T, D = unknown>(
    endpoint: string,
    data?: D
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T, D = unknown>(
    endpoint: string,
    data?: D
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Upload file
  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      return this.performRequest<T>(
        endpoint,
        {
          method: 'POST',
          body: formData,
        },
        false,
        false
      );
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
