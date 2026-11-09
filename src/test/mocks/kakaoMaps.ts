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

type ServicesStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

interface ServicesResponse {
  status: ServicesStatus;
  result: unknown[];
}

// services 검색은 콜백 기반이라 테스트가 검색어별 응답을 직접 지정할 수 있게 한다.
// 필요한 만큼만 흉내낸다(Places.keywordSearch, Geocoder.addressSearch, Status).
export const kakaoServicesMock = {
  placesResponse: { status: 'ZERO_RESULT', result: [] } as ServicesResponse,
  addressResponse: { status: 'ZERO_RESULT', result: [] } as ServicesResponse,
  keywordSearchCalls: [] as string[],
  addressSearchCalls: [] as string[],
  reset() {
    this.placesResponse = { status: 'ZERO_RESULT', result: [] };
    this.addressResponse = { status: 'ZERO_RESULT', result: [] };
    this.keywordSearchCalls = [];
    this.addressSearchCalls = [];
  },
};

class MockPlaces {
  keywordSearch(
    keyword: string,
    callback: (result: unknown[], status: ServicesStatus, pagination: unknown) => void,
  ) {
    kakaoServicesMock.keywordSearchCalls.push(keyword);
    const { result, status } = kakaoServicesMock.placesResponse;
    callback(result, status, {});
  }
}

class MockGeocoder {
  addressSearch(keyword: string, callback: (result: unknown[], status: ServicesStatus) => void) {
    kakaoServicesMock.addressSearchCalls.push(keyword);
    const { result, status } = kakaoServicesMock.addressResponse;
    callback(result, status);
  }
}

// 실제 SDK의 Coords는 WCONGNAMUL 좌표다. 테스트에서는 값이 눈에 보이도록 단순 선형 변환으로 흉내낸다
// (lat = 37 + y / 1e6, lng = 127 + x / 1e6, 한국 인근 유효 범위에 머물게 하기 위함). 정확한 투영이 아니라 호출 경로와 모서리 조합을 검증하기 위한 것이다.
class MockCoords {
  constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  toLatLng() {
    return new MockLatLng(37 + this.y / 1e6, 127 + this.x / 1e6);
  }
}

// 실제 SDK는 같은 이름으로 Tileset.add를 다시 호출하면 문제가 되므로(StrictMode 재마운트 방지 검증용)
// 목도 중복 등록을 에러로 만든다. 등록하면 kakao.maps.MapTypeId[이름]이 생기는 동작도 흉내낸다.
export const kakaoTilesetMock = {
  registered: new Map<string, unknown>(),
  reset() {
    this.registered.clear();
    for (const key of Object.keys(mockMapTypeId)) {
      delete mockMapTypeId[key];
    }
  },
};

const mockMapTypeId: Record<string, string> = {};

class MockTileset {
  constructor(public readonly options: unknown) {}

  static add(name: string, tileset: MockTileset) {
    if (kakaoTilesetMock.registered.has(name)) {
      throw new Error(`Tileset '${name}' is already registered`);
    }
    kakaoTilesetMock.registered.set(name, tileset);
    mockMapTypeId[name] = name;
  }
}

const mockKakao = {
  maps: {
    LatLng: MockLatLng,
    Coords: MockCoords,
    Tileset: MockTileset,
    MapTypeId: mockMapTypeId,
    services: {
      Places: MockPlaces,
      Geocoder: MockGeocoder,
      Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
    },
  },
};

export const installKakaoMapsMock = () => {
  (globalThis as unknown as Record<'kakao', unknown>).kakao = mockKakao;
};

export const uninstallKakaoMapsMock = () => {
  kakaoServicesMock.reset();
  kakaoTilesetMock.reset();
  delete (globalThis as unknown as Record<string, unknown>).kakao;
};
