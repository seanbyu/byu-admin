'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

// rendering-hoist-jsx: 테이블 헤더 키를 컴포넌트 외부로 호이스팅
const TABLE_HEADER_KEYS = [
  'table.number',
  'table.nameNickname',
  'table.email',
  'table.phone',
  'table.joinDate',
  'table.joinResign',
  'table.adminPermission',
  'table.profile',
  'table.position',
  'table.bookingAllowed',
] as const;

// rerender-memo: 테이블 헤더 컴포넌트 메모이제이션
export const StaffTableHeader = memo(function StaffTableHeader() {
  const t = useTranslations('staff');

  return (
    <thead className="bg-gray-50 border-b border-secondary-200">
      <tr>
        {TABLE_HEADER_KEYS.map((key) => (
          <th
            key={key}
            className="px-6 py-4 text-center text-xs font-medium text-secondary-500 whitespace-nowrap"
          >
            {t(key)}
          </th>
        ))}
      </tr>
    </thead>
  );
});

export default StaffTableHeader;
