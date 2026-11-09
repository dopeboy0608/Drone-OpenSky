import { LayoutOutlined } from '@ant-design/icons';
import { Button, Popover, Radio } from 'antd';

import {
  type AirspaceRenderMode,
  useAirspaceRenderModeStore,
} from '@/features/airspace/store/airspaceRenderModeStore';

const RENDER_MODE_OPTIONS: { value: AirspaceRenderMode; label: string }[] = [
  { value: 'polygon', label: '폴리곤' },
  { value: 'wms', label: 'WMS 타일' },
];

export const AirspaceRenderModeMenu = () => {
  const renderMode = useAirspaceRenderModeStore((state) => state.renderMode);
  const setRenderMode = useAirspaceRenderModeStore((state) => state.setRenderMode);

  return (
    // placement를 left로 둔 이유: 버튼이 우상단 가장자리에 있어 오른쪽/아래로 열면 모바일 폭에서 화면 밖으로 나간다.
    <Popover
      trigger="click"
      placement="left"
      title="공역 표시 방식"
      content={
        <Radio.Group
          value={renderMode}
          onChange={(event) => setRenderMode(event.target.value)}
          options={RENDER_MODE_OPTIONS}
          optionType="default"
          className="flex flex-col gap-1"
        />
      }
    >
      <Button
        shape="circle"
        icon={<LayoutOutlined />}
        aria-label="공역 표시 방식"
        className="shadow"
      />
    </Popover>
  );
};
