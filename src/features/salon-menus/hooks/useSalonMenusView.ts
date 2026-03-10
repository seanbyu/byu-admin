'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { useIndustries } from './useSalonMenus';
import { SalonIndustry, Industry } from '../types';
import {
  useSalonMenusUIStore,
  selectSelectedTab,
  selectShowReorderSettings,
  selectShowIndustryModal,
} from '../stores/salonMenusStore';

// 타입 정의
export interface UseSalonMenusViewReturn {
  // 데이터
  industries: Industry[];
  selectedIndustries: SalonIndustry[];
  selectedIndustryIds: string[];
  isLoading: boolean;
  // 상태 (from Zustand)
  selectedTab: string;
  showReorderSettings: boolean;
  showIndustryModal: boolean;
  // 액션 (from Zustand)
  setSelectedTab: (tab: string) => void;
  toggleReorderSettings: () => void;
  openIndustryModal: () => void;
  closeIndustryModal: () => void;
  // 비즈니스 로직 핸들러
  handleToggleIndustry: (industryId: string) => Promise<void>;
  handleReorderIndustries: (direction: 'up' | 'down', index: number) => Promise<void>;
}

export function useSalonMenusView(salonId: string): UseSalonMenusViewReturn {
  const t = useTranslations('menu');

  // API 데이터 훅 (TanStack Query)
  const {
    industries,
    selectedIndustries,
    isLoading,
    toggleIndustry,
    reorderIndustries,
  } = useIndustries(salonId);

  // Zustand state - 개별 셀렉터로 불필요한 리렌더링 방지
  const selectedTab = useSalonMenusUIStore(selectSelectedTab);
  const showReorderSettings = useSalonMenusUIStore(selectShowReorderSettings);
  const showIndustryModal = useSalonMenusUIStore(selectShowIndustryModal);

  // Zustand actions - useShallow로 안정적 참조 유지
  const actions = useSalonMenusUIStore(
    useShallow((state) => ({
      setSelectedTab: state.setSelectedTab,
      toggleReorderSettings: state.toggleReorderSettings,
      openIndustryModal: state.openIndustryModal,
      closeIndustryModal: state.closeIndustryModal,
    }))
  );

  // Memoized derived data
  const selectedIndustryIds = useMemo(
    () => selectedIndustries.map((i) => i.id),
    [selectedIndustries]
  );

  // 비즈니스 로직 핸들러
  const handleToggleIndustry = useCallback(
    async (industryId: string) => {
      try {
        const isSelected = selectedIndustryIds.includes(industryId);
        await toggleIndustry({ industryId, isSelected });
      } catch (error) {
        console.error(error);
        alert(t('errors.industryChangeError'));
      }
    },
    [selectedIndustryIds, toggleIndustry, t]
  );

  const handleReorderIndustries = useCallback(
    async (direction: 'up' | 'down', index: number) => {
      // js-early-exit
      if (!selectedIndustries.length) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= selectedIndustries.length) return;

      // js-tosorted-immutable: 불변성 유지
      const newIndustries = [...selectedIndustries];
      [newIndustries[index], newIndustries[targetIndex]] = [
        newIndustries[targetIndex],
        newIndustries[index],
      ];

      const orderedIds = newIndustries.map((i) => i.id);

      try {
        await reorderIndustries(orderedIds);
      } catch (e) {
        console.error(e);
        alert(t('errors.orderChangeFailed'));
      }
    },
    [selectedIndustries, reorderIndustries, t]
  );

  return useMemo(
    () => ({
      // 데이터
      industries,
      selectedIndustries,
      selectedIndustryIds,
      isLoading,
      // 상태
      selectedTab,
      showReorderSettings,
      showIndustryModal,
      // 액션
      ...actions,
      // 비즈니스 로직
      handleToggleIndustry,
      handleReorderIndustries,
    }),
    [
      industries,
      selectedIndustries,
      selectedIndustryIds,
      isLoading,
      selectedTab,
      showReorderSettings,
      showIndustryModal,
      actions,
      handleToggleIndustry,
      handleReorderIndustries,
    ]
  );
}
