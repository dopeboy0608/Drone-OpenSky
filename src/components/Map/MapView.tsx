import { useEffect, useState } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

const useCurrentCenter = () => {
  const [center, setCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setCenter(DEFAULT_CENTER);
      },
    );
  }, []);

  return center;
};

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
