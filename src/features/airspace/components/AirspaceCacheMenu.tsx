import { DatabaseOutlined } from '@ant-design/icons';
import { Button, Popover, Switch } from 'antd';

import { useAirspaceCacheSettingStore } from '@/features/airspace/store/airspaceCacheSettingStore';

export const AirspaceCacheMenu = () => {
  const enabled = useAirspaceCacheSettingStore((state) => state.enabled);
  const setEnabled = useAirspaceCacheSettingStore((state) => state.setEnabled);

  return (
    // placement를 left로 둔 이유: 우상단 가장자리 버튼이라 오른쪽/아래로 열면 모바일 폭에서 화면 밖으로 나간다(표시 방식 메뉴와 동일).
    <Popover
      trigger="click"
      placement="left"
      title="공역 캐시"
      content={
        <div className="flex w-48 flex-col gap-2">
          <Switch
            checked={enabled}
            onChange={setEnabled}
            checkedChildren="사용"
            unCheckedChildren="끔"
            aria-label="공역 캐시 사용"
          />
          <p className="m-0 text-xs text-gray-500">
            {enabled
              ? '24시간 안에는 저장된 데이터를 쓰고, 새로고침은 만료된 구역만 다시 받습니다.'
              : '열 때마다 새로 받고, 새로고침은 전체를 다시 받습니다.'}
          </p>
        </div>
      }
    >
      <Button
        shape="circle"
        icon={<DatabaseOutlined />}
        aria-label="공역 캐시"
        className="shadow"
      />
    </Popover>
  );
};
