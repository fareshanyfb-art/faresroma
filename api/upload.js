import { put } from '@vercel/blob';

const PASSWORD = 'love';

export async function POST(req) {
  if (req.headers.get('x-site-password') !== PASSWORD) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json(
        { error: 'No file' },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: 'File too large (25MB max)' },
        { status: 413 }
      );
    }

    const safe = String(file.name || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const blob = await put(
      `fares-
