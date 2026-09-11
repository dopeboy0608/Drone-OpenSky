import { useEffect, useState } from 'react';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export const useCurrentCenter = () => {
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
