import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SalonMenuService } from '@/lib/api-core';
import { unstable_cache, revalidateTag } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function makeMenuService() {
  return new SalonMenuService(createServiceClient(supabaseUrl, supabaseServiceKey));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');

    let data;
    if (type === 'industries') {
      data = await unstable_cache(
        () => makeMenuService().getIndustries(salonId),
        [`menus-industries-${salonId}`],
        { tags: [`menus-${salonId}`], revalidate: 3600 } // 1시간 (업종은 거의 안 바뀜)
      )();
    } else if (type === 'categories') {
      data = await unstable_cache(
        () => makeMenuService().getCategories(salonId),
        [`menus-categories-${salonId}`],
        { tags: [`menus-${salonId}`], revalidate: 300 } // 5분
      )();
    } else if (type === 'menus' || type === 'services') {
      const cid = categoryId || 'all';
      data = await unstable_cache(
        () => makeMenuService().getMenus(salonId, categoryId || undefined),
        [`menus-items-${salonId}-${cid}`],
        { tags: [`menus-${salonId}`], revalidate: 180 } // 3분
      )();
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid request type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);
    const service = new SalonMenuService(supabase);
    let result;

    switch (action) {
      case 'add_industry':
        await service.addSalonIndustry(salonId, data.industryId);
        break;
      case 'remove_industry':
        await service.removeSalonIndustry(salonId, data.industryId);
        break;
      case 'reorder_industries':
        await service.reorderIndustries(salonId, data.orderedIndustryIds);
        break;
      case 'create_category':
        result = await service.createCategory(
          salonId,
          data.name,
          data.displayOrder,
          data.industryId
        );
        break;
      case 'delete_category':
        await service.deleteCategory(data.id);
        break;
      case 'create_menu': // Renamed from create_service
      case 'create_service': // Legacy support
        result = await service.createMenu(
          salonId,
          data.categoryId,
          data.menuData || data.serviceData // Support both
        );
        break;
      case 'delete_menu': // Renamed from delete_service
      case 'delete_service':
        await service.deleteMenu(data.id);
        break;
      case 'update_category':
        result = await service.updateCategory(data.id, data.updates);
        break;
      case 'reorder_categories':
        await service.reorderCategories(salonId, data.categories);
        break;
      case 'update_menu': // Renamed
      case 'update_service':
        result = await service.updateMenu(data.id, data.updates);
        break;
      case 'reorder_menus': // Renamed
      case 'reorder_services':
        await service.reorderMenus(salonId, data.menus || data.services);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    revalidateTag(`menus-${salonId}`, 'default');
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
