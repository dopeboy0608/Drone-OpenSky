import { Spin } from 'antd';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';

interface AirspaceClickPendingProps {
  position: { lat: number; lng: number };
}

// WMS 모드 클릭은 WFS 응답을 기다리느라 박스가 늦게 뜨므로, 클릭 즉시 그 자리에 조회 중 표시를 올려 반응을 알린다.
// 카카오가 측정하는 루트를 0×0으로 두고 표시는 CSS로 중심을 맞추는 방식은 AirspaceZoneOverlay와 같다
// (앵커 오프셋이 내용 크기에 흔들리지 않게 하기 위함).
export const AirspaceClickPending = ({ position }: AirspaceClickPendingProps) => (
  <CustomOverlayMap position={position} xAnchor={0} yAnchor={0} zIndex={9}>
    <div className="relative h-0 w-0">
      {/* 표시가 지도 클릭/드래그를 가로채면 조회 중에 다음 클릭이 먹히지 않는다. */}
      <div
        role="status"
        aria-label="구역 조회 중"
        className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow"
      >
        <Spin size="small" />
      </div>
    </div>
  </CustomOverlayMap>
);
