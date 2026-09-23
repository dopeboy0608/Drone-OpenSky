import { AimOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface MapControlsProps {
  onRefreshPolygons: () => void;
  onMoveToCurrentLocation: () => void;
}

export const MapControls = ({ onRefreshPolygons, onMoveToCurrentLocation }: MapControlsProps) => (
  <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
    <Button
      shape="circle"
      icon={<ReloadOutlined />}
      onClick={onRefreshPolygons}
      aria-label="공역 새로고침"
      className="shadow"
    />
    <Button
      shape="circle"
      icon={<AimOutlined />}
      onClick={onMoveToCurrentLocation}
      aria-label="현재위치로 이동"
      className="shadow"
    />
  </div>
);
