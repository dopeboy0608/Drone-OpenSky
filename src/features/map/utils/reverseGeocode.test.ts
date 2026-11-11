import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { reverseGeocode } from '@/features/map/utils/reverseGeocode';
import {
  installKakaoMapsMock,
  kakaoServicesMock,
  uninstallKakaoMapsMock,
} from '@/test/mocks/kakaoMaps';

const POINT = { lat: 37.5663, lng: 126.9779 };

const addressResult = (road: string | null, lot: string) => [
  {
    address: { address_name: lot },
    road_address: road === null ? null : { address_name: road },
  },
];

describe('reverseGeocode', () => {
  beforeEach(() => {
    installKakaoMapsMock();
  });

  afterEach(() => {
    uninstallKakaoMapsMock();
  });

  it('x=경도, y=위도 순서로 좌표를 넘긴다', async () => {
    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: addressResult('서울 중구 세종대로 110', '서울 중구 태평로1가 31'),
    };

    await reverseGeocode(POINT);

    expect(kakaoServicesMock.coord2AddressCalls).toEqual([{ x: POINT.lng, y: POINT.lat }]);
  });

  it('도로명 주소가 있으면 도로명을 앞에 두고 지번을 함께 준다', async () => {
    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: addressResult('서울 중구 세종대로 110', '서울 중구 태평로1가 31'),
    };

    await expect(reverseGeocode(POINT)).resolves.toEqual({
      primary: '서울 중구 세종대로 110',
      secondary: '서울 중구 태평로1가 31',
    });
  });

  it('도로명 주소가 없으면 지번 주소만 준다', async () => {
    kakaoServicesMock.coord2AddressResponse = {
      status: 'OK',
      result: addressResult(null, '강원 평창군 대관령면 횡계리 1'),
    };

    await expect(reverseGeocode(POINT)).resolves.toEqual({
      primary: '강원 평창군 대관령면 횡계리 1',
    });
  });

  it('주소가 없는 곳은 행정구역으로 대신한다', async () => {
    kakaoServicesMock.coord2RegionResponse = {
      status: 'OK',
      result: [
        { region_type: 'B', address_name: '경기도 시흥시 정왕동' },
        { region_type: 'H', address_name: '경기도 시흥시 정왕1동' },
      ],
    };

    await expect(reverseGeocode(POINT)).resolves.toEqual({
      primary: '경기도 시흥시 정왕동',
      isRegionOnly: true,
    });
  });

  it('주소도 행정구역도 없으면 null을 준다', async () => {
    await expect(reverseGeocode(POINT)).resolves.toBeNull();
  });

  it('주소 조회가 오류 상태면 실패로 처리한다', async () => {
    kakaoServicesMock.coord2AddressResponse = { status: 'ERROR', result: [] };

    await expect(reverseGeocode(POINT)).rejects.toThrow();
  });
});
