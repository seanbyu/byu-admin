import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { SettingsService } from '@/lib/api-core';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST: Upload image
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const service = new SettingsService(supabase);
    const imageUrl = await service.uploadCoverImage(salonId, file);

    return NextResponse.json({ success: true, data: { imageUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

// DELETE: Remove image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const supabase = createServiceClient();
    const service = new SettingsService(supabase);
    await service.deleteCoverImage(salonId);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = error instanceof Error && 'status' in error && (error as Error & { status: number }).status === 404 ? 404 : 500;
    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
