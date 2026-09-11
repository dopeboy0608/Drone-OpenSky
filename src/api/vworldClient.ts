import axios from 'axios';

// VWorld API는 CORS를 지원하지 않아 개발 서버 프록시(/api/vworld → rsbuild.config.ts)를 거쳐 호출한다.
// 프로덕션 배포 시에는 별도 프록시/서버가 필요하다 (ROADMAP.md TODO 참고).
export const vworldClient = axios.create({
  baseURL: '/api/vworld',
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
