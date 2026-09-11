import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

import { useCurrentCenter } from '@/features/map/hooks/useCurrentCenter';

export const MapView = () => {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY,
  });
  const center = useCurrentCenter();

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        지도를 불러오지 못했습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">지도를 불러오는 중...</div>
    );
  }

  return <Map center={center} level={5} style={{ width: '100%', height: '100%' }} />;
};
