import type { ResolvedAddress } from '@/types/address';

export type { ResolvedAddress };

type GeocoderStatus = kakao.maps.services.Status;

// SDK 응답 중 이 파일이 읽는 필드만 둔다. 제네릭을 추론에 맡기면 콜백 인자가 {}로 좁혀진다.
interface CoordToAddressItem {
  address?: { address_name: string } | null;
  road_address?: { address_name: string } | null;
}
interface CoordToRegionItem {
  address_name: string;
}

// 두 변환 API가 같은 "콜백 → Promise, OK / 결과 없음 / 오류" 분기를 가져서 한 곳에 둔다.
const promisifyGeocoder = <T>(
  call: (callback: (result: T[], status: GeocoderStatus) => void) => void,
  pick: (result: T[]) => ResolvedAddress | null,
  errorMessage: string,
) =>
  new Promise<ResolvedAddress | null>((resolve, reject) => {
    call((result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(pick(result));
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        resolve(null);
      } else {
        reject(new Error(errorMessage));
      }
    });
  });

const geocodeAddress = (point: { lat: number; lng: number }) =>
  promisifyGeocoder<CoordToAddressItem>(
    // Kakao는 x=경도, y=위도 순서다.
    (callback) => new kakao.maps.services.Geocoder().coord2Address(point.lng, point.lat, callback),
    ([first]) => {
      const road = first?.road_address?.address_name;
      const lot = first?.address?.address_name;

      if (road) {
        return { primary: road, ...(lot ? { secondary: lot } : {}) };
      }

      return lot ? { primary: lot } : null;
    },
    '[map] 좌표→주소 변환 실패',
  );

const geocodeRegion = (point: { lat: number; lng: number }) =>
  promisifyGeocoder<CoordToRegionItem>(
    (callback) =>
      new kakao.maps.services.Geocoder().coord2RegionCode(point.lng, point.lat, callback),
    ([first]) => (first?.address_name ? { primary: first.address_name, isRegionOnly: true } : null),
    '[map] 좌표→행정구역 변환 실패',
  );

// 바다·산지처럼 주소가 없는 곳은 행정구역으로 대신한다. 둘 다 없으면 null.
export const reverseGeocode = async (point: {
  lat: number;
  lng: number;
}): Promise<ResolvedAddress | null> =>
  (await geocodeAddress(point)) ?? (await geocodeRegion(point));
