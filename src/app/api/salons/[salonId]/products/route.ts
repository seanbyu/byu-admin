import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/api-core';

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
    const service = new ProductService(supabase);

    let data;
    if (type === 'categories') {
      data = await service.getCategories(salonId);
    } else if (type === 'products') {
      data = await service.getProducts(salonId, categoryId || undefined);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid request type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Products API Error:', error);
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
    const service = new ProductService(supabase);
    let result;

    switch (action) {
      case 'create_category':
        result = await service.createCategory(salonId, data.name, data.displayOrder);
        break;
      case 'update_category':
        result = await service.updateCategory(data.id, data.name);
        break;
      case 'delete_category':
        await service.deleteCategory(data.id);
        break;
      case 'reorder_categories':
        await service.reorderCategories(data.categories);
        break;
      case 'create_product':
        result = await service.createProduct(salonId, data.categoryId, data.productData);
        break;
      case 'update_product':
        result = await service.updateProduct(data.id, data.updates);
        break;
      case 'delete_product':
        await service.deleteProduct(data.id);
        break;
      case 'reorder_products':
        await service.reorderProducts(data.products);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
