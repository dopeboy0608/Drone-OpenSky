import axios from 'axios';

// 브라우저에서 VWorld를 직접 호출하면 CORS로 막힌다. rsbuild dev 서버에서만 프록시
// (rsbuild.config.ts의 server.proxy `/vworld-api`)를 거친다. `MODE === 'development'`로
// 판단해야 Vitest(mode: 'test')에서는 실제 VWorld 도메인 그대로 MSW가 가로챌 수 있다.
// 프로덕션(GitHub Pages 정적 호스팅)은 프록시가 없어 VWorld 도메인을 직접 호출한다.
export const vworldClient = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '/vworld-api' : 'https://api.vworld.kr/req',
});

vworldClient.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    key: import.meta.env.VITE_VWORLD_API_KEY,
  };
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
