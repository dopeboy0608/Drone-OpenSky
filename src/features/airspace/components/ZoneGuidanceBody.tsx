import { Tag } from 'antd';

import { formatZoneAddress } from '@/features/airspace/utils/formatZoneAddress';
import { resolveFlightGuidance } from '@/features/airspace/utils/resolveFlightGuidance';

import type { AddressState } from '@/types/address';

interface ZoneGuidanceBodyProps {
  zoneType: string | null;
  address: AddressState;
}

export const ZoneGuidanceBody = ({ zoneType, address }: ZoneGuidanceBodyProps) => {
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
      <div>{guidance.detail}</div>
      {addressText && <div className="text-gray-600">{addressText}</div>}
    </div>
  );
};
