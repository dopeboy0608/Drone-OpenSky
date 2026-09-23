import { CloseOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';

interface AirspaceZoneOverlayProps {
  position: { lat: number; lng: number };
  zoneType: string;
  onClose: () => void;
}

export const AirspaceZoneOverlay = ({ position, zoneType, onClose }: AirspaceZoneOverlayProps) => (
  <CustomOverlayMap position={position} yAnchor={1.4} zIndex={10}>
    <Card
      size="small"
      title={zoneType}
      extra={
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          aria-label="닫기"
        />
      }
      className="whitespace-nowrap"
      styles={{ body: { display: 'none' } }}
    />
  </CustomOverlayMap>
);
