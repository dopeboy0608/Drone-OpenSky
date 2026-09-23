import { CustomOverlayMap } from 'react-kakao-maps-sdk';

interface AirspaceZoneOverlayProps {
  position: { lat: number; lng: number };
  zoneType: string;
  onClose: () => void;
}

export const AirspaceZoneOverlay = ({ position, zoneType, onClose }: AirspaceZoneOverlayProps) => (
  <CustomOverlayMap position={position} yAnchor={1.4} zIndex={10}>
    <button
      type="button"
      onClick={onClose}
      className="rounded-md bg-white px-2 py-1 text-xs whitespace-nowrap text-gray-800 shadow"
    >
      {zoneType}
    </button>
  </CustomOverlayMap>
);
