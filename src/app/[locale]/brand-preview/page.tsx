type AppPalette = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
};

type PairOption = {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  admin: AppPalette;
  user: AppPalette;
};

const brandCore = {
  navy: '#0B1F3B',
  mint: '#22C3A6',
  text: '#1F2937',
  surface: '#F5F7FA',
};

// 세트 비교 데이터: 옵션을 추가하면 화면이 자동으로 늘어난다.
const pairOptions: PairOption[] = [
  {
    id: 'balanced-tech',
    name: 'Balanced Tech',
    description: '브랜드 일관성과 시인성의 균형이 가장 좋음',
    recommended: true,
    admin: {
      bg: '#F6F8FB',
      surface: '#FFFFFF',
      text: '#111827',
      muted: '#6B7280',
      primary: '#0B1F3B',
      accent: '#22C3A6',
    },
    user: {
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1F2937',
      muted: '#64748B',
      primary: '#0A84FF',
      accent: '#0B1F3B',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: '터치 액션을 강하게 띄우는 사용자 앱 중심 세트',
    admin: {
      bg: '#F4F7FC',
      surface: '#FFFFFF',
      text: '#0F172A',
      muted: '#667085',
      primary: '#13294B',
      accent: '#14B8A6',
    },
    user: {
      bg: '#FFFFFF',
      surface: '#F3F8FF',
      text: '#0F172A',
      muted: '#64748B',
      primary: '#0066FF',
      accent: '#00A3FF',
    },
  },
  {
    id: 'warm-premium',
    name: 'Warm Premium',
    description: '살롱 감성을 높인 부드러운 프리미엄 톤',
    admin: {
      bg: '#F7F7F8',
      surface: '#FFFFFF',
      text: '#1F2937',
      muted: '#6B7280',
      primary: '#1D2A3B',
      accent: '#6FC7B5',
    },
    user: {
      bg: '#FFFFFF',
      surface: '#FAF7F4',
      text: '#2B2B2D',
      muted: '#78716C',
      primary: '#C47F4B',
      accent: '#0B1F3B',
    },
  },
];

function ArenSymbol({
  primary,
  accent,
  surface,
}: {
  primary: string;
  accent: string;
  surface: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-11 w-11"
      role="img"
      aria-label="AREN symbol"
    >
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        rx="28"
        fill={surface}
        stroke="#E5E7EB"
      />
      <path
        d="M60 24L28 96H42L49 80H71L78 96H92L60 24ZM54 68L60 54L66 68H54Z"
        fill={primary}
      />
      {/* 공통 브랜드 포인트: 중앙 점은 예약 허브 의미 */}
      <circle cx="60" cy="68" r="4" fill={accent} />
    </svg>
  );
}

function PaletteStrip({
  title,
  palette,
}: {
  title: string;
  palette: AppPalette;
}) {
  const values = [
    palette.primary,
    palette.accent,
    palette.bg,
    palette.surface,
    palette.text,
    palette.muted,
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <p className="text-xs font-medium text-[#111827]">{title}</p>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {values.map((hex) => (
          <div key={hex}>
            <div
              className="h-6 rounded-sm border border-[#E5E7EB]"
              style={{ backgroundColor: hex }}
            />
            <p className="mt-1 font-mono text-[10px] text-[#6B7280]">{hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductPreview({
  label,
  palette,
  cta,
}: {
  label: string;
  palette: AppPalette;
  cta: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: '#E5E7EB', backgroundColor: palette.bg }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold tracking-[0.12em]"
          style={{ color: palette.muted }}
        >
          {label}
        </p>
        <span
          className="rounded-full px-2 py-1 text-[10px] font-semibold"
          style={{
            backgroundColor: `${palette.primary}16`,
            color: palette.primary,
          }}
        >
          LIVE
        </span>
      </div>

      {/* 실제 판단용 UI: 통계 카드 + 버튼 + 상태배지 */}
      <div
        className="mt-3 rounded-xl border p-4"
        style={{ borderColor: '#E5E7EB', backgroundColor: palette.surface }}
      >
        <p className="text-sm font-semibold" style={{ color: palette.text }}>
          오늘 예약 17건
        </p>
        <p className="mt-1 text-xs" style={{ color: palette.muted }}>
          취소 1건 / 신규 4건
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: palette.primary }}
        >
          {cta}
        </button>
        <button
          className="rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{
            borderColor: '#D1D5DB',
            color: palette.text,
            backgroundColor: '#FFFFFF',
          }}
        >
          보조 액션
        </button>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: `${palette.accent}22`,
            color: palette.text,
          }}
        >
          대기 3건
        </span>
      </div>
    </div>
  );
}

function PairCard({ option }: { option: PairOption }) {
  return (
    <article className="rounded-3xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-[#6B7280]">
            COLOR PAIR
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">
            {option.name}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">{option.description}</p>
        </div>
        {option.recommended && (
          <span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold text-white">
            추천
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ProductPreview
          label="ADMIN APP"
          palette={option.admin}
          cta="스케줄 편집"
        />
        <ProductPreview
          label="SALON USER APP"
          palette={option.user}
          cta="예약하기"
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <PaletteStrip title="Admin Palette" palette={option.admin} />
        <PaletteStrip title="User Palette" palette={option.user} />
      </div>
    </article>
  );
}

export default function BrandPreviewPage() {
  const recommended =
    pairOptions.find((item) => item.recommended) ?? pairOptions[0];

  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <header className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <ArenSymbol
              primary={brandCore.navy}
              accent={brandCore.mint}
              surface={brandCore.surface}
            />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-[#6B7280]">
                AREN BRAND CORE
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                One Brand, Two Product Tones
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm text-[#6B7280]">
            브랜드 코어 색상(
            <span className="font-medium text-[#111827]">{brandCore.navy}</span>
            ,{' '}
            <span className="font-medium text-[#111827]">{brandCore.mint}</span>
            )은 고정하고, Admin과 User 앱의 기능 목적에 맞게 UI 팔레트를
            분리했다. 현재 추천 세트는{' '}
            <span className="font-medium text-[#111827]">
              {recommended.name}
            </span>
            .
          </p>
        </header>

        {/* 핵심 비교 섹션: 각 세트에서 Admin/User를 동시에 보고 결정한다. */}
        <section className="mt-8 space-y-5">
          {pairOptions.map((option) => (
            <PairCard key={option.id} option={option} />
          ))}
        </section>
      </div>
    </main>
  );
}
