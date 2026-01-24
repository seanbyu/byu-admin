'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/layout/Layout';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useIndustries } from '../hooks/useSalonMenus';
import MenuList from './components/MenuList';
import IndustrySelectionModal from './components/IndustrySelectionModal';
import { Button } from '@/components/ui/Button';
import { Settings, Plus } from 'lucide-react';
import { useState } from 'react';

export default function SalonMenusPageView() {
  const { user } = useAuthStore();

  const { data, isLoading, toggleIndustry, reorderIndustries } = useIndustries(
    user?.salonId || ''
  );

  const industries = data?.all || [];
  const selectedIndustries = data?.selected || [];
  const selectedIndustryIds = selectedIndustries.map((i) => i.id);

  const handleToggleIndustry = async (industryId: string) => {
    try {
      const isSelected = selectedIndustryIds.includes(industryId);
      await toggleIndustry({ industryId, isSelected });

      if (!isSelected) {
        alert(
          '업종이 추가되었습니다. 직원 관리 메뉴에서 해당 업종의 기본 직급이 자동으로 생성되었는지 확인해보세요.'
        );
      }
    } catch (error) {
      console.error(error);
      alert('업종 변경 중 오류가 발생했습니다.');
    }
  };

  const handleReorderIndustries = async (
    direction: 'up' | 'down',
    index: number
  ) => {
    if (!selectedIndustries.length) return;

    const newIndustries = [...selectedIndustries];
    // Swap
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIndustries.length) return;

    [newIndustries[index], newIndustries[targetIndex]] = [
      newIndustries[targetIndex],
      newIndustries[index],
    ];

    // Extract IDs in new order
    const orderedIds = newIndustries.map((i) => i.id);

    try {
      await reorderIndustries(orderedIds);
    } catch (e) {
      console.error(e);
      alert('순서 변경 실패');
    }
  };

  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">메뉴 관리</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReorderSettings(!showReorderSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            순서 설정
          </Button>
        </div>

        {/* Industry Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTab === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          {selectedIndustries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => setSelectedTab(ind.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTab === ind.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {ind.name}
            </button>
          ))}
          <button
            onClick={() => setShowIndustryModal(true)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            업종 추가
          </button>
        </div>

        {/* Selected Industries Reordering (Visible when Settings clicked) */}
        {showReorderSettings && selectedIndustries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              업종 노출 순서 설정
            </h3>
            <div className="flex flex-col gap-2 max-w-lg">
              {selectedIndustries.map((industry, index) => (
                <div
                  key={industry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold text-gray-500 border border-gray-200">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-700">
                      {industry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorderIndustries('up', index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-md hover:bg-white text-gray-600 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorderIndustries('down', index)}
                      disabled={index === selectedIndustries.length - 1}
                      className="p-1.5 rounded-md hover:bg-white text-gray-600 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              * 위/아래 버튼을 눌러 메뉴판에 보여질 순서를 변경할 수 있습니다.
            </p>
          </div>
        )}

        <IndustrySelectionModal
          isOpen={showIndustryModal}
          onClose={() => setShowIndustryModal(false)}
          industries={industries}
          selectedIndustryIds={selectedIndustryIds}
          onToggleIndustry={handleToggleIndustry}
        />

        {/* Main Content Area */}
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          {user?.salonId ? (
            <MenuList
              salonId={user.salonId}
              orderedIndustries={selectedIndustries}
              selectedTab={selectedTab}
            />
          ) : (
            <div className="p-8">살롱 정보 없음</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
