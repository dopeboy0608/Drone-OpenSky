import { Tag } from 'antd';

import { formatZoneOverlapStatus } from '@/features/airspace/utils/formatZoneOverlapStatus';
import { formatZoneAddress } from '@/features/airspace/utils/formatZoneAddress';
import { resolveFlightGuidance } from '@/features/airspace/utils/resolveFlightGuidance';

import type { SelectedZone } from '@/features/airspace/types';
import type { AddressState } from '@/types/address';

interface ZoneGuidanceBodyProps {
  zoneType: string | null;
  address: AddressState;
  isHidden?: boolean;
  overlap?: SelectedZone['overlap'];
}

export const ZoneGuidanceBody = ({
  zoneType,
  address,
  isHidden = false,
  overlap,
}: ZoneGuidanceBodyProps) => {
  const guidance = resolveFlightGuidance(zoneType);
  const addressText = formatZoneAddress(address);
  const overlapStatus = formatZoneOverlapStatus(overlap);
  const overlapZoneTypes = overlap?.zoneTypes ?? [];

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
      {/* 태그 한 줄 높이(22px)를 확인이 끝나기 전에도 차지해, 결과가 도착해도 카드 높이가 변하지 않게 한다.
          겹친 구역도 최상위와 같은 레벨 색의 태그로 그려 한눈에 구분되게 한다. */}
      {zoneType !== null && (
        <div className="flex min-h-[22px] flex-wrap items-center gap-1 text-gray-600">
          {overlapZoneTypes.length > 0 && <span>겹침</span>}
          {overlapZoneTypes.map((overlappedZoneType) => (
            <Tag
              key={overlappedZoneType}
              color={resolveFlightGuidance(overlappedZoneType).tone}
              className="m-0"
            >
              {overlappedZoneType}
            </Tag>
          ))}
          {overlapStatus && <span>{overlapStatus}</span>}
        </div>
      )}
      {/* 두 줄 높이를 미리 잡아 두는 이유: 주소가 도착하며 카드가 위로 자라는 것을 막는다. */}
      {addressText && <div className="min-h-8 text-gray-600">{addressText}</div>}
    </div>
  );
};
