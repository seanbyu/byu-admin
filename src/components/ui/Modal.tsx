import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // sm: 접두사 필수 — html { font-size: 14px } 로 인해 rem 기반 max-w가 줄어들어
  // 모바일에서 양옆 여백 발생. 모바일은 항상 w-full(전체 너비) 사용.
  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    '2xl': 'sm:max-w-6xl',
    full: 'sm:max-w-[90vw]',
  };

  const modalContent = (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 modal-backdrop-enter"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white shadow-xl w-full',
          'rounded-t-2xl rounded-b-none sm:rounded-xl',
          'sm:mx-4 sm:w-auto',
          'flex flex-col',
          'max-h-[85dvh] sm:max-h-[calc(100vh-80px)]',
          'modal-enter',
          sizes[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-[var(--modal-px)] sm:px-[var(--modal-px-md)] py-[var(--modal-py)] sm:py-[var(--modal-py-md)] border-b border-secondary-200">
            <h2 className="text-base sm:text-xl font-semibold text-secondary-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                'p-1 rounded-[var(--btn-radius)]',
                'text-secondary-400 hover:text-secondary-600',
                'hover:bg-secondary-100',
                'transition-colors duration-fast'
              )}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-[var(--modal-px)] sm:px-[var(--modal-px-md)] py-[var(--modal-py)] sm:py-[var(--modal-py-md)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-[var(--modal-px)] sm:px-[var(--modal-px-md)] py-[var(--modal-py)] sm:py-[var(--modal-py-md)] border-t border-secondary-200 bg-secondary-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use Portal to render at document body level
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }

  return null;
};
