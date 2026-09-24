import { get, put } from '@vercel/blob';

const PASSWORD = 'love';
const PATH = 'fares-roma/site-data.json';

const empty = {
  chat: [],
  moments: [],
  song: null,
  pages: []
};

function allowed(req) {
  return req.headers.get('x-site-password') === PASSWORD;
}

export async function GET(req) {
  if (!allowed(req)) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await get(PATH, {
      access: 'private',
      useCache: false
    });

    // أول مرة: الملف لسه مش موجود
    if (!result || !result.stream) {
      return Response.json(empty);
    }

    const text = await new Response(result.stream).text();

    if (!text.trim()) {
      return Response.json(empty);
    }

    const saved = JSON.parse(text);

    return Response.json({
      ...empty,
      ...saved
    });

  } catch (e) {
    // لو الملف مش موجود، نبدأ ببيانات فاضية
    if (
      e?.code === 'BLOB_NOT_FOUND' ||
      e?.status === 404 ||
      e?.statusCode === 404
    ) {
      return Response.json(empty);
    }

    return Response.json(
      {
        error: 'Could not read data',
        detail: e?.message || String(e)
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  if (!allowed(req)) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const incoming = await req.json();

    const data = {
      ...empty,
      ...incoming
    };

    await put(
      PATH,
      JSON.stringify(data),
      {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      }
    );

    return Response.json({
      ok: true,
      data
    });

  } catch (e) {
    return Response.json(
      {
        error: 'Could not save data',
        detail: e?.message || String(e)
      },
      { status: 500 }
    );
  }
}
