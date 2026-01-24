import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Updated import
import { SalonMenuService } from '@salon-admin/api-core';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');

    const supabase = createClient(req);
    const service = new SalonMenuService(supabase);

    let data;
    if (type === 'industries') {
      data = await service.getIndustries(salonId);
    } else if (type === 'categories') {
      data = await service.getCategories(salonId);
    } else if (type === 'menus' || type === 'services') {
      // Support both for transition or strictly 'menus'
      // Prefer 'menus' but 'services' might be cached or used in transit
      data = await service.getMenus(salonId, categoryId || undefined);
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

    const supabase = createClient(req);
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

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
