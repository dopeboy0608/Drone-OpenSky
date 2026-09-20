import type { VercelRequest, VercelResponse } from '@vercel/node';

// VWorld(국내 IP)가 Cloudflare 등 해외 클라우드 엣지發 요청을 차단하는 것으로 확인되어
// (docs/TROUBLE_SHOOTING.md 참고), relay를 Vercel의 한국 리전(icn1, server/vercel.json)에
// 고정 배포한다. VWorld는 Referer 헤더의 값을 검증하지 않고 존재 여부만 확인하지만(즉
// 아무 값이나 통과함), VWORLD_API_KEY가 실제로 등록된 서비스 URL(GitHub Pages)과 코드상
// 값을 일치시켜 의도를 명확히 한다.
const VWORLD_REFERER = 'https://dopeboy0608.github.io';

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
    res.statusCode = 204;
    res.end();
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
  res.statusCode = vworldResponse.status;
  res.end(body);
}
