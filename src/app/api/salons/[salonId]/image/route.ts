import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET_NAME = 'salon-images';

// Ensure bucket exists
async function ensureBucketExists(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b: any) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    if (error && !error.message.includes('already exists')) {
      console.error('Failed to create bucket:', error);
    }
  }
}

// POST: Upload image
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure bucket exists
    await ensureBucketExists(supabase);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${salonId}/cover/image.${fileExt}`;

    // Delete existing logo if any
    const { data: existingSalon } = await supabase
      .from('salons')
      .select('cover_image_url')
      .eq('id', salonId)
      .single();

    if (existingSalon?.cover_image_url) {
      // Extract file path from URL
      const urlParts = existingSalon.cover_image_url.split(`${BUCKET_NAME}/`);
      if (urlParts[1]) {
        await supabase.storage.from(BUCKET_NAME).remove([urlParts[1]]);
      }
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload new image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    // Update salon cover_image_url
    const { error: updateError } = await supabase
      .from('salons')
      .update({
        cover_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    if (updateError) {
      console.error('DB update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update salon record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { imageUrl },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current logo URL
    const { data: salon, error: fetchError } = await supabase
      .from('salons')
      .select('cover_image_url')
      .eq('id', salonId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Salon not found' },
        { status: 404 }
      );
    }

    if (salon?.cover_image_url) {
      // Extract file path from URL
      const urlParts = salon.cover_image_url.split(`${BUCKET_NAME}/`);
      if (urlParts[1]) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([urlParts[1]]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
        }
      }
    }

    // Clear cover_image_url in database
    const { error: updateError } = await supabase
      .from('salons')
      .update({
        cover_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    if (updateError) {
      console.error('DB update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update salon record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
