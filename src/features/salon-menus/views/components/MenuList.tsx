'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useCategories, useMenus } from '../../hooks/useSalonMenus';
import { SalonIndustry } from '../../types';

import MenusSidebar from './MenusSidebar';
import CreateCategoryForm from './CreateCategoryForm';
import CategoryItem from './CategoryItem';
import MenuItems from './MenuItems';

interface MenuListProps {
  salonId: string;
  orderedIndustries: SalonIndustry[];
  selectedTab: string;
}

export default function MenuList({
  salonId,
  orderedIndustries = [],
  selectedTab,
}: MenuListProps) {
  const {
    data: categoriesData,
    isLoading,
    createCategory,
    deleteCategory,
    reorderCategories,
    updateCategory,
  } = useCategories(salonId);

  const categories = categoriesData || [];

  const [isCreating, setIsCreating] = useState(false);
  const [selectedIndustryForCreate, setSelectedIndustryForCreate] =
    useState('');

  const handleCreateCategory = async (data: {
    name: string;
    displayOrder: number;
    industryId?: string;
  }) => {
    try {
      await createCategory(data);
      setIsCreating(false);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('duplicate key') || e.code === '23505') {
        alert('이미 존재하는 카테고리 이름입니다.');
      } else if (e.message?.includes('industry_id')) {
        alert('데이터베이스 업데이트가 필요합니다. (migration 미적용)');
      } else {
        alert('카테고리 생성 실패: ' + (e.message || '알 수 없는 오류'));
      }
    }
  };

  const { updateMenu } = useMenus(salonId);

  // Editing State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState('');

  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuData, setEditMenuData] = useState({
    name: '',
    price: '',
    duration: '30',
  });

  const handleStartEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return;
    try {
      await updateCategory({ id: editingCategoryId, name: editCategoryName });
      setEditingCategoryId(null);
    } catch (e) {
      console.error(e);
      alert('카테고리 수정 실패');
    }
  };

  const handleStartEditMenu = (menu: any) => {
    setEditingMenuId(menu.id);
    setEditMenuData({
      name: menu.name,
      price: menu.base_price?.toString() || '0',
      duration: menu.duration_minutes?.toString() || '30',
    });
  };

  const handleSaveMenu = async () => {
    if (!editingMenuId || !editMenuData.name.trim()) return;
    try {
      await updateMenu({
        id: editingMenuId,
        updates: {
          name: editMenuData.name,
          price: parseInt(editMenuData.price) || 0,
          duration: parseInt(editMenuData.duration) || 30,
        },
      });
      setEditingMenuId(null);
    } catch (e) {
      console.error(e);
      alert('메뉴 정보 수정 실패');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm('정말 삭제하시겠습니까? 포함된 메뉴도 영향을 받을 수 있습니다.')
    )
      return;
    try {
      await deleteCategory(id);
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    }
  };

  const { data: allMenus = [] } = useMenus(salonId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Reset selected category when industry tab changes
  React.useEffect(() => {
    setSelectedCategoryId(null);
  }, [selectedTab]);

  // Calculate counts
  const menuCounts = categories.reduce(
    (acc, cat) => {
      const count = allMenus.filter((s) => s.category_id === cat.id).length;
      acc[cat.id] = count;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex w-full gap-6 items-start">
      {/* Left Sidebar - Treated as separate card */}
      <div className="w-64 flex-shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <MenusSidebar
          categories={categories}
          orderedIndustries={orderedIndustries}
          selectedIndustryId={selectedTab}
          onSelectIndustry={() => {}} // This seems unused or implicitly handled via URL or parent
          onAddCategory={(industryId) => {
            setSelectedIndustryForCreate(industryId || '');
            setIsCreating(true);
          }}
          menuCounts={menuCounts}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onReorderCategories={reorderCategories}
        />
      </div>

      {/* Main Content - Treated as separate card */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 min-h-[600px]">
        {isCreating && (
          <CreateCategoryForm
            categories={categories}
            orderedIndustries={orderedIndustries}
            selectedIndustryForCreate={selectedIndustryForCreate}
            onSelectIndustryForCreate={setSelectedIndustryForCreate}
            onCreateCategory={handleCreateCategory}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {isLoading ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500 mb-2">등록된 카테고리가 없습니다.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> 카테고리 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {orderedIndustries.map((industry) => {
              // Filter by tab
              if (selectedTab !== 'all' && selectedTab !== industry.id)
                return null;

              let industryCategories = categories.filter(
                (c) => c.industry_id === industry.id
              );

              // Filter by selected category
              if (selectedCategoryId) {
                industryCategories = industryCategories.filter(
                  (c) => c.id === selectedCategoryId
                );
              }

              if (industryCategories.length === 0) return null;

              return (
                <div key={industry.id} className="space-y-4 pt-4">
                  <div className="text-section-header px-1 mb-2">
                    {industry.name}
                  </div>
                  {industryCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onDelete={handleDeleteCategory}
                      onEdit={handleStartEditCategory}
                      isEditing={editingCategoryId === category.id}
                      editName={editCategoryName}
                      onEditNameChange={setEditCategoryName}
                      onSaveEdit={handleSaveCategory}
                      onCancelEdit={() => setEditingCategoryId(null)}
                    >
                      <MenuItems
                        salonId={salonId}
                        categoryId={category.id}
                        editingMenuId={editingMenuId}
                        editMenuData={editMenuData}
                        onEditMenu={handleStartEditMenu}
                        onEditMenuDataChange={setEditMenuData}
                        onSaveMenu={handleSaveMenu}
                        onCancelEditMenu={() => setEditingMenuId(null)}
                      />
                    </CategoryItem>
                  ))}
                </div>
              );
            })}

            {/* Other Categories */}
            {(() => {
              if (selectedTab !== 'all') return null;
              const stringifiedIndustryIds = orderedIndustries.map((i) => i.id);
              let otherCategories = categories.filter(
                (c) =>
                  !c.industry_id ||
                  !stringifiedIndustryIds.includes(c.industry_id)
              );

              // Filter by selected category
              if (selectedCategoryId) {
                otherCategories = otherCategories.filter(
                  (c) => c.id === selectedCategoryId
                );
              }

              if (otherCategories.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-500">
                      기타
                    </div>
                    {otherCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        onDelete={handleDeleteCategory}
                        onEdit={handleStartEditCategory}
                        isEditing={editingCategoryId === category.id}
                        editName={editCategoryName}
                        onEditNameChange={setEditCategoryName}
                        onSaveEdit={handleSaveCategory}
                        onCancelEdit={() => setEditingCategoryId(null)}
                        category={category}
                      >
                        <MenuItems
                          salonId={salonId}
                          categoryId={category.id}
                          editingMenuId={editingMenuId}
                          editMenuData={editMenuData}
                          onEditMenu={handleStartEditMenu}
                          onEditMenuDataChange={setEditMenuData}
                          onSaveMenu={handleSaveMenu}
                          onCancelEditMenu={() => setEditingMenuId(null)}
                        />
                      </CategoryItem>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
