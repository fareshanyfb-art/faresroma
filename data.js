import { get, put } from '@vercel/blob';

const PASSWORD = 'love';
const PATH = 'fares-roma/site-data.json';
const empty = { chat: [], moments: [], song: null, pages: [] };

function allowed(req) {
  return req.headers.get('x-site-password') === PASSWORD;
}

export async function GET(req) {
  if (!allowed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { stream } = await get(PATH, { access: 'private', useCache: false });
    const text = await new Response(stream).text();
    return Response.json({ ...empty, ...JSON.parse(text) });
  } catch (e) {
    if (e?.code === 'BLOB_NOT_FOUND') return Response.json(empty);
    return Response.json({ error: 'Could not read data' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!allowed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const incoming = await req.json();
    const data = { ...empty, ...incoming };
    await put(PATH, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ error: 'Could not save data' }, { status: 500 });
  }
}
