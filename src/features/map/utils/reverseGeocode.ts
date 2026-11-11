export interface ResolvedAddress {
  primary: string;
  // 지번 주소. 도로명이 primary일 때만 붙인다.
  secondary?: string;
  // 주소가 없어 행정구역으로 대신한 경우.
  isRegionOnly?: boolean;
}

const geocodeAddress = (point: { lat: number; lng: number }) =>
  new Promise<ResolvedAddress | null>((resolve, reject) => {
    // Kakao는 x=경도, y=위도 순서다.
    new kakao.maps.services.Geocoder().coord2Address(point.lng, point.lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const [first] = result;
        const road = first?.road_address?.address_name;
        const lot = first?.address?.address_name;

        if (road) {
          resolve({ primary: road, ...(lot ? { secondary: lot } : {}) });
        } else if (lot) {
          resolve({ primary: lot });
        } else {
          resolve(null);
        }
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        resolve(null);
      } else {
        reject(new Error('[map] 좌표→주소 변환 실패'));
      }
    });
  });

const geocodeRegion = (point: { lat: number; lng: number }) =>
  new Promise<ResolvedAddress | null>((resolve, reject) => {
    new kakao.maps.services.Geocoder().coord2RegionCode(point.lng, point.lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const name = result[0]?.address_name;
        resolve(name ? { primary: name, isRegionOnly: true } : null);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        resolve(null);
      } else {
        reject(new Error('[map] 좌표→행정구역 변환 실패'));
      }
    });
  });

// 바다·산지처럼 주소가 없는 곳은 행정구역으로 대신한다. 둘 다 없으면 null.
export const reverseGeocode = async (point: {
  lat: number;
  lng: number;
}): Promise<ResolvedAddress | null> =>
  (await geocodeAddress(point)) ?? (await geocodeRegion(point));
