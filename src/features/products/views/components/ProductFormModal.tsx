'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { Input } from '@/components/ui/Input';
import { Product, ProductFormData } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
  product?: Product | null;
  isLoading?: boolean;
}

export const ProductFormModal = memo(function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
  isLoading,
}: ProductFormModalProps) {
  const t = useTranslations();
  const isEdit = !!product;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        setPrice(String(product.price));
        setStockQuantity(product.stock_quantity != null ? String(product.stock_quantity) : '');
        setIsActive(product.is_active);
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setStockQuantity('');
        setIsActive(true);
      }
    }
  }, [isOpen, product]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price) || 0,
      stock_quantity: stockQuantity !== '' ? Number(stockQuantity) : null,
      is_active: isActive,
    });
  }, [name, description, price, stockQuantity, isActive, onSave]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('product.editProduct') : t('product.addProduct')}
      size="sm"
      footer={
        <ModalActions
          onCancel={onClose}
          onSave={handleSubmit}
          isSaving={isLoading}
          saveDisabled={!name.trim()}
        />
      }
    >
      <div className="space-y-4">
        {/* 제품명 */}
        <Input
          label={t('product.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('product.namePlaceholder')}
          required
        />

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('product.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('product.descriptionPlaceholder')}
            rows={2}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-800 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* 가격 */}
        <Input
          label={t('product.price')}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t('product.pricePlaceholder')}
          min={0}
          className="text-right"
        />

        {/* 재고 */}
        <Input
          label={t('product.stock')}
          type="number"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          placeholder={t('product.stockPlaceholder')}
          min={0}
          helperText={stockQuantity === '' ? t('product.unlimited') : undefined}
        />

        {/* 활성 여부 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">
            {isActive ? t('product.active') : t('product.inactive')}
          </span>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-primary-500' : 'bg-secondary-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>
    </Modal>
  );
});
