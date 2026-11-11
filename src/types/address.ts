export interface ResolvedAddress {
  primary: string;
  // 지번 주소. 도로명이 primary일 때만 붙인다.
  secondary?: string;
  // 주소가 없어 행정구역으로 대신한 경우.
  isRegionOnly?: boolean;
}

// 지도 클릭 지점의 주소 조회 상태. map(조회)과 airspace(안내 박스 표시)가 함께 쓰므로 공유 타입으로 둔다.
export type AddressState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; address: ResolvedAddress }
  | { status: 'notFound' }
  | { status: 'error' };
