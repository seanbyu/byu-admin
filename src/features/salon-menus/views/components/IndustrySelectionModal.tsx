import { X, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface IndustrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  industries: { id: string; name: string }[];
  selectedIndustryIds: string[];
  onToggleIndustry: (id: string) => void;
}

export default function IndustrySelectionModal({
  isOpen,
  onClose,
  industries,
  selectedIndustryIds,
  onToggleIndustry,
}: IndustrySelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">업종 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-md mb-6 flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              새로운 업종을 추가하면, 해당 업종에 필요한{' '}
              <strong>기본 직급(예: 디자이너, 아티스트 등)</strong>이 자동으로
              생성됩니다.
              <br />
              이미 직급이 존재하는 경우 중복해서 생성되지 않습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industries.map((industry) => {
              const isSelected = selectedIndustryIds.includes(industry.id);
              return (
                <button
                  key={industry.id}
                  onClick={() => onToggleIndustry(industry.id)}
                  className={`
                  relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                  }
                `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-semibold text-base">
                      {industry.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-primary-600">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <Button onClick={onClose} className="px-6">
            완료
          </Button>
        </div>
      </div>
    </div>
  );
}
