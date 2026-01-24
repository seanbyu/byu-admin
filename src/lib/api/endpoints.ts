/**
 * API 엔드포인트 및 Query Key 정의
 * Query Key는 React Query의 캐싱과 무효화에 사용됩니다.
 */

export const endpoints = {
  // 인증 (Auth)
  auth: {
    login: {
      path: () => '/auth/login',
      queryKey: () => ['auth', 'login'] as const,
    },
    logout: {
      path: () => '/auth/logout',
      queryKey: () => ['auth', 'logout'] as const,
    },
    register: {
      path: () => '/auth/register',
      queryKey: () => ['auth', 'register'] as const,
    },
    forgotPassword: {
      path: () => '/auth/forgot-password',
      queryKey: () => ['auth', 'forgot-password'] as const,
    },
    resetPassword: {
      path: () => '/auth/reset-password',
      queryKey: () => ['auth', 'reset-password'] as const,
    },
    me: {
      path: () => '/auth/me',
      queryKey: () => ['auth', 'me'] as const,
    },
  },

  // 살롱 (Salons)
  salons: {
    all: {
      path: () => '/salons',
      queryKey: (params?: any) => ['salons', params] as const,
    },
    detail: {
      path: (id: string) => `/salons/${id}`,
      queryKey: (id: string) => ['salons', id] as const,
    },
    approve: {
      path: (id: string) => `/salons/${id}/approve`,
      queryKey: (id: string) => ['salons', id, 'approve'] as const,
    },

    // 살롱 내 직원 (Staff in Salon)
    staff: {
      path: (salonId: string) => `/salons/${salonId}/staff`,
      queryKey: (salonId: string, params?: any) =>
        ['salons', salonId, 'staff', params] as const,
    },

    // 살롱 내 메뉴 (Menus in Salon)
    menus: {
      path: (salonId: string) => `/salons/${salonId}/menus`,
      queryKey: (salonId: string, params?: any) =>
        ['salons', salonId, 'menus', params] as const,
    },

    // 살롱 내 고객 (Customers in Salon)
    customers: {
      path: (salonId: string) => `/salons/${salonId}/customers`,
      queryKey: (salonId: string, params?: any) =>
        ['salons', salonId, 'customers', params] as const,
    },

    // 살롱 내 예약 (Bookings) - Added
    bookings: {
      path: (salonId: string) => `/salons/${salonId}/bookings`,
      queryKey: (salonId: string, params?: any) =>
        ['salons', salonId, 'bookings', params] as const,
    },

    // 살롱 매출 (Sales in Salon)
    sales: {
      path: (salonId: string) => `/salons/${salonId}/sales`,
      queryKey: (salonId: string, params: any) =>
        ['salons', salonId, 'sales', params] as const,
    },
  },

  // 직원 (Staff)
  staff: {
    all: {
      path: () => '/staff',
      queryKey: (params?: any) => ['staff', params] as const,
    },
    detail: {
      path: (id: string) => `/staff/${id}`,
      queryKey: (id: string) => ['staff', id] as const,
    },
    sales: {
      path: (staffId: string) => `/staff/${staffId}/sales`,
      queryKey: (staffId: string, params: any) =>
        ['staff', staffId, 'sales', params] as const,
    },
  },

  // 메뉴 (Menus)
  menus: {
    all: {
      path: () => '/menus',
      queryKey: (params?: any) => ['menus', params] as const,
    },
    detail: {
      path: (id: string) => `/menus/${id}`,
      queryKey: (id: string) => ['menus', id] as const,
    },
  },

  // 예약 (Bookings)
  bookings: {
    all: {
      path: () => '/bookings',
      queryKey: (params?: any) => ['bookings', params] as const,
    },
    detail: {
      path: (id: string) => `/bookings/${id}`,
      queryKey: (id: string) => ['bookings', id] as const,
    },
    cancel: {
      path: (id: string) => `/bookings/${id}/cancel`,
      queryKey: (id: string) => ['bookings', id, 'cancel'] as const,
    },
    complete: {
      path: (id: string) => `/bookings/${id}/complete`,
      queryKey: (id: string) => ['bookings', id, 'complete'] as const,
    },
  },

  // 고객 (Customers)
  customers: {
    all: {
      path: () => '/customers',
      queryKey: (params?: any) => ['customers', params] as const,
    },
    detail: {
      path: (id: string) => `/customers/${id}`,
      queryKey: (id: string) => ['customers', id] as const,
    },
  },

  // 리뷰 (Reviews)
  reviews: {
    all: {
      path: () => '/reviews',
      queryKey: (params?: any) => ['reviews', params] as const,
    },
    detail: {
      path: (id: string) => `/reviews/${id}`,
      queryKey: (id: string) => ['reviews', id] as const,
    },
    respond: {
      path: (id: string) => `/reviews/${id}/respond`,
      queryKey: (id: string) => ['reviews', id, 'respond'] as const,
    },
  },

  // 채팅 (Chat)
  chat: {
    rooms: {
      path: () => '/chat/rooms',
      queryKey: (params?: any) => ['chat', 'rooms', params] as const,
    },
    room: {
      path: (roomId: string) => `/chat/rooms/${roomId}`,
      queryKey: (roomId: string) => ['chat', 'rooms', roomId] as const,
    },
    messages: {
      path: (roomId: string) => `/chat/rooms/${roomId}/messages`,
      queryKey: (roomId: string, params?: any) =>
        ['chat', 'rooms', roomId, 'messages', params] as const,
    },
    markAsRead: {
      path: (roomId: string) => `/chat/rooms/${roomId}/read`,
      queryKey: (roomId: string) => ['chat', 'rooms', roomId, 'read'] as const,
    },
  },

  // 파일 업로드 (Upload)
  upload: {
    image: {
      path: () => '/upload/image',
      queryKey: () => ['upload', 'image'] as const,
    },
    images: {
      path: () => '/upload/images',
      queryKey: () => ['upload', 'images'] as const,
    },
  },
} as const;

/**
 * Query Key Factory
 * 특정 도메인의 모든 쿼리를 무효화할 때 사용
 */
export const queryKeys = {
  auth: ['auth'] as const,
  salons: ['salons'] as const,
  staff: ['staff'] as const,
  menus: ['menus'] as const,
  bookings: ['bookings'] as const,
  customers: ['customers'] as const,
  reviews: ['reviews'] as const,
  chat: ['chat'] as const,
  upload: ['upload'] as const,
  designers: ['designers'] as const,
} as const;
