import { get, put } from '@vercel/blob';
import { getVercelOidcToken } from '@vercel/oidc';

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

async function blobOptions() {
  const oidcToken = await getVercelOidcToken({
    expirationBufferMs: 5 * 60 * 1000
  });

  const storeId = process.env.BLOB_STORE_ID;

  if (!storeId) {
    throw new Error('BLOB_STORE_ID is missing');
  }

  return {
    access: 'public',
    oidcToken,
    storeId
  };
}

export async function GET(req) {
  if (!allowed(req)) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const options = await blobOptions();

    const result = await get(PATH, {
      ...options,
      useCache: false
    });

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

    const options = await blobOptions();

    await put(
      PATH,
      JSON.stringify(data),
      {
        ...options,
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
