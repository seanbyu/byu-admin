import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Staff } from './types';
import { ApiResponse } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Client arg kept for compatibility but unused if we use apiClient (which uses global endpoints/axios-like)
// Or we can remove it. Existing hooks pass supabase client.
// We can ignore it.

export const createStaffApi = (client?: SupabaseClient<any>) => {
  return {
    getStaffList: async (salonId: string): Promise<ApiResponse<Staff[]>> => {
      // Use apiClient (GET)
      // Endpoint: endpoints.salons.staff (GET /salons/[id]/staff)
      return apiClient.get(endpoints.salons.staff.path(salonId));
    },

    updateStaff: async (
      salonId: string,
      staffId: string, // staffId is needed for payload
      updates: Partial<Staff>
    ) => {
      // Use apiClient (POST with action)
      // Endpoint: endpoints.salons.staff (POST /salons/[id]/staff) usually?
      // Wait, endpoints.salons.staff path returns /salons/[id]/staff.
      // My route.ts POST handler is at that path.
      return apiClient.post(endpoints.salons.staff.path(salonId), {
        action: 'update_staff',
        staffId,
        updates,
      });
    },
  };
};

export const staffApi = {
  // Legacy support removed
};
