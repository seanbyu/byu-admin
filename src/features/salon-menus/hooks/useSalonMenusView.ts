'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useIndustries } from './useSalonMenus';
import { SalonIndustry, Industry } from '../types';

// 타입 정의
export interface UseSalonMenusViewReturn {
  // 데이터
  industries: Industry[];
  selectedIndustries: SalonIndustry[];
  selectedIndustryIds: string[];
  isLoading: boolean;
  // 상태
  selectedTab: string;
  showReorderSettings: boolean;
  showIndustryModal: boolean;
  // 액션
  setSelectedTab: (tab: string) => void;
  toggleReorderSettings: () => void;
  openIndustryModal: () => void;
  closeIndustryModal: () => void;
  handleToggleIndustry: (industryId: string) => Promise<void>;
  handleReorderIndustries: (direction: 'up' | 'down', index: number) => Promise<void>;
}

export function useSalonMenusView(salonId: string): UseSalonMenusViewReturn {
  const t = useTranslations('menu');
  // API 데이터 훅
  const { data, isLoading, toggleIndustry, reorderIndustries } = useIndustries(salonId);

  // 로컬 상태
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  // useMemo로 파생 데이터 메모이제이션
  const industries = useMemo(() => data?.all || [], [data?.all]);
  const selectedIndustries = useMemo(() => data?.selected || [], [data?.selected]);
  const selectedIndustryIds = useMemo(
    () => selectedIndustries.map((i) => i.id),
    [selectedIndustries]
  );

  // useCallback으로 핸들러 메모이제이션
  const toggleReorderSettings = useCallback(() => {
    setShowReorderSettings((prev) => !prev);
  }, []);

  const openIndustryModal = useCallback(() => {
    setShowIndustryModal(true);
  }, []);

  const closeIndustryModal = useCallback(() => {
    setShowIndustryModal(false);
  }, []);

  const handleToggleIndustry = useCallback(async (industryId: string) => {
    try {
      const isSelected = selectedIndustryIds.includes(industryId);
      await toggleIndustry({ industryId, isSelected });

      if (!isSelected) {
        alert(t('success.industryAdded'));
      }
    } catch (error) {
      console.error(error);
      alert(t('errors.industryChangeError'));
    }
  }, [selectedIndustryIds, toggleIndustry]);

  const handleReorderIndustries = useCallback(async (
    direction: 'up' | 'down',
    index: number
  ) => {
    // js-early-exit: 조기 반환
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
  }, [selectedIndustries, reorderIndustries]);

  return {
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
    setSelectedTab,
    toggleReorderSettings,
    openIndustryModal,
    closeIndustryModal,
    handleToggleIndustry,
    handleReorderIndustries,
  };
}
