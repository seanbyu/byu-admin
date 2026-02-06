import { Staff, StaffPosition } from '../../../types';

export interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  onSave: (staffId: string, updates: Partial<Staff>) => Promise<void>;
}

export interface ProfileFormData {
  name: string;
  phone: string;
  description: string;
  experience: number;
  specialties: string;
  profileImage: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    tiktok: string;
    facebook: string;
  };
}

export interface PositionSelectorProps {
  positions: StaffPosition[];
  selectedPositionId: string | null;
  onSelect: (positionId: string | null) => void;
  onCreatePosition: (data: { name: string; name_en: string; name_th: string; rank: number }) => Promise<any>;
  onUpdatePosition: (data: { positionId: string; dto: { name?: string; name_en?: string; name_th?: string } }) => Promise<any>;
  onDeletePosition: (positionId: string) => Promise<any>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface ProfileImageUploaderProps {
  profileImage: string;
  salonId: string;
  staffId: string;
  onImageChange: (url: string) => void;
}

export interface SocialLinksData {
  instagram: string;
  youtube: string;
  tiktok: string;
  facebook: string;
}

export interface SocialLinksFormProps {
  values: SocialLinksData;
  onChange: (field: keyof SocialLinksData, value: string) => void;
}
