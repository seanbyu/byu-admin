/**
 * AppError — 표준화된 에러 클래스
 *
 * API Route에서 throw → handleApiError()가 적절한 HTTP 상태코드로 응답
 */

export type ErrorCode =
  // 인증/권한
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  // 리소스
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  // 입력 유효성
  | "VALIDATION_ERROR"
  | "MISSING_REQUIRED_FIELD"
  // 비즈니스 로직
  | "BOOKING_ALREADY_CANCELLED"
  | "BOOKING_ALREADY_CONFIRMED"
  | "BOOKING_CONFLICT"
  | "INVALID_STATUS_TRANSITION"
  // 외부 서비스
  | "LINE_API_ERROR"
  | "SUPABASE_ERROR"
  // 기타
  | "INTERNAL_ERROR"
  | "UNKNOWN";

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED:              401,
  FORBIDDEN:                 403,
  NOT_FOUND:                 404,
  ALREADY_EXISTS:            409,
  VALIDATION_ERROR:          422,
  MISSING_REQUIRED_FIELD:    422,
  BOOKING_ALREADY_CANCELLED: 409,
  BOOKING_ALREADY_CONFIRMED: 409,
  BOOKING_CONFLICT:          409,
  INVALID_STATUS_TRANSITION: 422,
  LINE_API_ERROR:            502,
  SUPABASE_ERROR:            503,
  INTERNAL_ERROR:            500,
  UNKNOWN:                   500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;
  }
}

// ============================================
// API Route 에러 핸들러
// ============================================
import { NextResponse } from "next/server";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(process.env.NODE_ENV === "development" && { details: error.details }),
        },
      },
      { status: error.statusCode }
    );
  }

  // Supabase / DB 에러
  if (isSupabaseError(error)) {
    console.error("[API] Supabase error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SUPABASE_ERROR",
          message: "Database operation failed",
          ...(process.env.NODE_ENV === "development" && { details: (error as any).message }),
        },
      },
      { status: 503 }
    );
  }

  // 예상치 못한 에러
  console.error("[API] Unexpected error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}

function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "details" in error) &&
    "message" in error
  );
}

// ============================================
// 유효성 검사 헬퍼
// ============================================
export function requireField<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null || value === "") {
    throw new AppError("MISSING_REQUIRED_FIELD", `'${fieldName}' is required`);
  }
  return value;
}
