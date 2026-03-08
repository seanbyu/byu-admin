import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/api-core';
import { unstable_cache, revalidateTag } from 'next/cache';


function makeProductService() {
  return new ProductService(createServiceClient(supabaseUrl, supabaseServiceKey));
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
    if (type === 'categories') {
      data = await unstable_cache(
        () => makeProductService().getCategories(salonId),
        [`products-categories-${salonId}`],
        { tags: [`products-${salonId}`], revalidate: 600 } // 10분
      )();
    } else if (type === 'products') {
      const cid = categoryId || 'all';
      data = await unstable_cache(
        () => makeProductService().getProducts(salonId, categoryId || undefined),
        [`products-items-${salonId}-${cid}`],
        { tags: [`products-${salonId}`], revalidate: 300 } // 5분
      )();
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

    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);
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

    revalidateTag(`products-${salonId}`, 'default');
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
