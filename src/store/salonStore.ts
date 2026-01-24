import { create } from 'zustand';
import { Salon, Staff, Service } from '@/types';

interface SalonState {
  currentSalon: Salon | null;
  staff: Staff[];
  services: Service[];
  setCurrentSalon: (salon: Salon | null) => void;
  setStaff: (staff: Staff[]) => void;
  setServices: (services: Service[]) => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  removeStaff: (id: string) => void;
  addService: (service: Service) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  removeService: (id: string) => void;
}

export const useSalonStore = create<SalonState>((set) => ({
  currentSalon: null,
  staff: [],
  services: [],

  setCurrentSalon: (salon) => set({ currentSalon: salon }),

  setStaff: (staff) => set({ staff }),

  setServices: (services) => set({ services }),

  addStaff: (member) =>
    set((state) => ({
      staff: [...state.staff, member],
    })),

  updateStaff: (id, data) =>
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),

  removeStaff: (id) =>
    set((state) => ({
      staff: state.staff.filter((s) => s.id !== id),
    })),

  addService: (service) =>
    set((state) => ({
      services: [...state.services, service],
    })),

  updateService: (id, data) =>
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),

  removeService: (id) =>
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    })),
}));
