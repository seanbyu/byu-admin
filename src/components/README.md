# src/components — 공통 컴포넌트

Feature에 종속되지 않는 **재사용 가능한 공유 컴포넌트**만 위치합니다.

## 폴더 구조

```
components/
├── ui/          # 디자인 시스템 Primitive (Button, Input, Modal, Table 등)
├── common/      # 앱 전역 공통 컴포넌트 (LanguageSwitcher 등)
├── auth/        # 인증 관련 공유 컴포넌트 (AuthInitializer 등 Provider 성격)
├── layout/      # 레이아웃 컴포넌트 (Header, Sidebar, Layout)
├── providers/   # Context Providers (QueryClientProvider 등)
└── realtime/    # Realtime 구독 컴포넌트
```

## 배치 기준

| 컴포넌트 유형 | 위치 |
|--------------|------|
| 특정 feature에서만 사용 | `src/features/{feature}/views/components/` |
| 2개 이상 feature에서 사용 | `src/components/common/` |
| UI 프리미티브 (스타일만) | `src/components/ui/` |
| 앱 레이아웃/구조 | `src/components/layout/` |
| 인증/세션 Provider | `src/components/auth/` |

## ❌ 하지 말 것
- feature 전용 컴포넌트를 여기에 두지 않기 (예: `components/staff/StaffCard.tsx` ❌)
- `ui/`에 비즈니스 로직 넣기 ❌
