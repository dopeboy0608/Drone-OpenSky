import axios from 'axios';

export const vworldClient = axios.create({
  baseURL: 'https://api.vworld.kr/req',
});

vworldClient.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    key: import.meta.env.VITE_VWORLD_API_KEY,
  };
  return config;
});

vworldClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[vworldClient]', error);
    return Promise.reject(error);
  },
);
