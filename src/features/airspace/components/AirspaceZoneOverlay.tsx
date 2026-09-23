import { CustomOverlayMap } from 'react-kakao-maps-sdk';

interface AirspaceZoneOverlayProps {
  position: { lat: number; lng: number };
  zoneType: string;
  onClose: () => void;
}

export const AirspaceZoneOverlay = ({ position, zoneType, onClose }: AirspaceZoneOverlayProps) => (
  <CustomOverlayMap position={position} yAnchor={1.4} zIndex={10}>
    <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm whitespace-nowrap text-gray-800 shadow">
      <span>{zoneType}</span>
      {/* 닫기 버튼을 별도로 분리해, 라벨 영역을 눌러도 실수로 닫히지 않게 한다. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-base leading-none text-gray-500"
      >
        ✕
      </button>
    </div>
  </CustomOverlayMap>
);
