'use server';

import { createClient } from '@supabase/supabase-js';
import { checkPermission } from '@/lib/server/checkPermission';

// ============================================
// Types
// ============================================

interface CreateCustomerParams {
  salonId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  customerType?: 'local' | 'foreign';
  accessToken: string;
}

interface UpdateCustomerParams {
  customerId: string;
  salonId: string;
  updates: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    customerType?: 'local' | 'foreign';
  };
  accessToken: string;
}

interface DeleteCustomerParams {
  customerId: string;
  salonId: string;
  accessToken: string;
}

// ============================================
// 고객 생성
// ============================================

export async function createCustomer({
  salonId,
  name,
  phone,
  email,
  notes,
  customerType = 'local',
  accessToken,
}: CreateCustomerParams) {
  // 권한 검증: customers 모듈의 canWrite 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'customers', 'canWrite');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        salon_id: salonId,
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        customer_type: customerType,
        created_by: permCheck.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create customer error:', error);
      return { error: `Failed to create customer: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Create Customer Error:', err);
    return { error: err.message };
  }
}

// ============================================
// 고객 수정
// ============================================

export async function updateCustomer({
  customerId,
  salonId,
  updates,
  accessToken,
}: UpdateCustomerParams) {
  // 권한 검증: customers 모듈의 canWrite 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'customers', 'canWrite');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // 고객이 해당 살롱에 속하는지 확인
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('id, salon_id')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return { error: 'Customer not found' };
    }

    if (customer.salon_id !== salonId) {
      return { error: 'PERMISSION_DENIED: Customer does not belong to this salon' };
    }

    // 업데이트 실행
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Update customer error:', error);
      return { error: `Failed to update customer: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Update Customer Error:', err);
    return { error: err.message };
  }
}

// ============================================
// 고객 삭제
// ============================================

export async function deleteCustomer({
  customerId,
  salonId,
  accessToken,
}: DeleteCustomerParams) {
  // 권한 검증: customers 모듈의 canDelete 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'customers', 'canDelete');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // 고객이 해당 살롱에 속하는지 확인
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('id, salon_id')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      return { error: 'Customer not found' };
    }

    if (customer.salon_id !== salonId) {
      return { error: 'PERMISSION_DENIED: Customer does not belong to this salon' };
    }

    // 삭제 실행
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      console.error('Delete customer error:', error);
      return { error: `Failed to delete customer: ${error.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Delete Customer Error:', err);
    return { error: err.message };
  }
}
