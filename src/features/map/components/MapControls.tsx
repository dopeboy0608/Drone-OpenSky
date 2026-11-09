import { AimOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { ReactNode } from 'react';

interface MapControlsProps {
  onRefreshPolygons: () => void;
  onMoveToCurrentLocation: () => void;
  // 도메인(airspace) 컨트롤을 map 쪽이 알지 않도록 버튼 슬롯으로 받는다.
  children?: ReactNode;
}

export const MapControls = ({
  onRefreshPolygons,
  onMoveToCurrentLocation,
  children,
}: MapControlsProps) => (
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
    {children}
  </div>
);
