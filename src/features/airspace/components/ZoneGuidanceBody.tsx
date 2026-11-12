import { Tag } from 'antd';

import { formatZoneAddress } from '@/features/airspace/utils/formatZoneAddress';
import { resolveFlightGuidance } from '@/features/airspace/utils/resolveFlightGuidance';

import type { AddressState } from '@/types/address';

interface ZoneGuidanceBodyProps {
  zoneType: string | null;
  address: AddressState;
  isHidden?: boolean;
}

export const ZoneGuidanceBody = ({
  zoneType,
  address,
  isHidden = false,
}: ZoneGuidanceBodyProps) => {
  const guidance = resolveFlightGuidance(zoneType);
  const addressText = formatZoneAddress(address);

  return (
    // 카드는 한 줄 폭(whitespace-nowrap)으로 펴지므로, 안내 문구만 최대 폭을 두어 줄바꿈한다.
    <div className="flex max-w-[240px] flex-col gap-1 text-xs whitespace-normal">
      {zoneType !== null && (
        <div>
          <Tag color={guidance.tone} className="m-0">
            {guidance.headline}
          </Tag>
        </div>
      )}
      {isHidden && <div className="text-gray-500">범례에서 숨긴 구역입니다.</div>}
      <div>{guidance.detail}</div>
      {/* 두 줄 높이를 미리 잡아 두는 이유: 주소가 도착하며 카드가 위로 자라는 것을 막는다. */}
      {addressText && <div className="min-h-8 text-gray-600">{addressText}</div>}
    </div>
  );
};
