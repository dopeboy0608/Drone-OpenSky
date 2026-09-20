import type { VercelRequest, VercelResponse } from '@vercel/node';

// VWorld(국내 IP)가 Cloudflare 등 해외 클라우드 엣지發 요청을 차단하는 것으로 확인되어
// (docs/TROUBLE_SHOOTING.md 참고), relay를 Vercel의 한국 리전(icn1, server/vercel.json)에
// 고정 배포한다. Referer 헤더는 존재 여부만 검증되므로(값은 무관) 아무 값이나 채워도 된다.
const VWORLD_REFERER = 'https://drone-opensky.dopeboy0608.workers.dev';

const ALLOWED_ORIGINS = new Set([
  'https://dopeboy0608.github.io',
  'https://drone-opensky.dopeboy0608.workers.dev',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const requestUrl = new URL(req.url ?? '', 'http://localhost');
  const vworldPath = requestUrl.pathname.replace(/^\/api\/vworld-api/, '/req');
  const vworldUrl = new URL(vworldPath, 'https://api.vworld.kr');
  vworldUrl.search = requestUrl.search;
  vworldUrl.searchParams.set('key', process.env.VWORLD_API_KEY ?? '');

  const vworldResponse = await fetch(vworldUrl.toString(), {
    headers: { Referer: VWORLD_REFERER },
  });

  const contentType = vworldResponse.headers.get('content-type');
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }
  const body = await vworldResponse.text();
  res.status(vworldResponse.status);
  res.send(body);
}
