/**
 * 실제 Kakao Maps SDK는 `<script>` 태그로 비동기 주입되며 jsdom 환경에서는 로딩되지 않는다.
 * 좌표 변환 등 `kakao.maps.*`를 직접 생성/사용하는 순수 로직을 테스트할 때는 실제 SDK 전체를
 * 재현하지 않고, 테스트 대상이 실제로 쓰는 API만 최소로 흉내낸다. 필요한 클래스가 늘어나면
 * 이 파일에 추가한다.
 */
class MockLatLng {
  constructor(
    private readonly lat: number,
    private readonly lng: number,
  ) {}

  getLat() {
    return this.lat;
  }

  getLng() {
    return this.lng;
  }

  equals(latlng: MockLatLng) {
    return this.lat === latlng.getLat() && this.lng === latlng.getLng();
  }

  toString() {
    return `(${this.lat}, ${this.lng})`;
  }
}

const mockKakao = {
  maps: {
    LatLng: MockLatLng,
  },
};

export const installKakaoMapsMock = () => {
  (globalThis as unknown as Record<'kakao', unknown>).kakao = mockKakao;
};

export const uninstallKakaoMapsMock = () => {
  delete (globalThis as unknown as Record<string, unknown>).kakao;
};
