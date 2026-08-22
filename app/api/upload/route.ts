import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getAdminBucket, STORAGE_BUCKET } from '@/lib/firebase/admin';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const bucket = getAdminBucket();
  if (!bucket) {
    return NextResponse.json(
      { error: 'Firebase Storage is not configured. Set FIREBASE_STORAGE_BUCKET.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const slug = String(formData.get('slug') ?? 'package').replace(/[^a-z0-9-]/gi, '-');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG and WebP images are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be smaller than 8 MB.' }, { status: 400 });
    }

    const objectPath = `packages/${slug}-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = bucket.file(objectPath);
    await blob.save(buffer, {
      contentType: file.type,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    await blob.makePublic();

    const url = `https://storage.googleapis.com/${STORAGE_BUCKET}/${objectPath}`;
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('[admin] image upload failed:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
