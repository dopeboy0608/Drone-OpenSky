import type { AddressState } from '@/types/address';

export const formatZoneAddress = (address: AddressState): string | null => {
  switch (address.status) {
    case 'loading':
      return '주소 조회 중…';
    case 'success':
      return address.address.secondary
        ? `${address.address.primary} (${address.address.secondary})`
        : address.address.primary;
    case 'notFound':
      return '주소를 찾지 못했습니다.';
    case 'error':
      return '주소를 불러오지 못했습니다.';
    default:
      return null;
  }
};
