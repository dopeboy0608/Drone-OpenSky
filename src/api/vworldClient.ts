import axios from 'axios';

// 브라우저에서 VWorld를 직접 호출하면 CORS로 막힌다. dev에서는 rsbuild 프록시
// (rsbuild.config.ts의 server.proxy `/vworld-api`)를, 프로덕션에서는 Vercel 서버리스
// relay(server/api/vworld-api/[...path].ts, 이슈 #16)를 거친다. VWorld가 Cloudflare 등
// 해외 클라우드 엣지發 요청을 차단해 Cloudflare Worker relay는 불가능함을 확인했고
// (docs/TROUBLE_SHOOTING.md), Vercel 서울 리전(icn1)으로 우회한다.
// `MODE === 'development'`로 판단해야 Vitest(mode: 'test')에서는 relay 도메인 그대로
// MSW가 가로챌 수 있다.
const PRODUCTION_VWORLD_BASE_URL = 'https://server-eosin-five-92.vercel.app/api/vworld-api';

export const vworldClient = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '/vworld-api' : PRODUCTION_VWORLD_BASE_URL,
});

vworldClient.interceptors.request.use((config) => {
  // 프로덕션은 Worker가 VWORLD_API_KEY를 서버 사이드에서 주입하므로 프론트엔드에서
  // key를 넘기지 않는다 (dev만 rsbuild 프록시를 거쳐 VWorld를 직접 호출하므로 필요).
  if (import.meta.env.MODE === 'development') {
    config.params = {
      ...config.params,
      key: import.meta.env.VITE_VWORLD_API_KEY,
    };
  }
  return config;
});

vworldClient.interceptors.response.use(
  (response) => {
    // VWorld는 인증/요청 오류도 HTTP 200으로 응답하고 본문에 예외를 담아 보낸다.
    const data = response.data;
    const isXmlException = typeof data === 'string' && data.includes('ServiceExceptionReport');
    const isJsonException = typeof data === 'object' && data?.response?.status === 'ERROR';

    if (isXmlException || isJsonException) {
      const error = new Error('[vworldClient] VWorld API 응답 오류');
      console.error(error.message, data);
      return Promise.reject(error);
    }

    return response;
  },
  (error) => {
    console.error('[vworldClient]', error);
    return Promise.reject(error);
  },
);
