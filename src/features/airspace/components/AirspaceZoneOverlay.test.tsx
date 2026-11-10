import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AirspaceZoneOverlay } from '@/features/airspace/components/AirspaceZoneOverlay';

const captured = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));

vi.mock('react-kakao-maps-sdk', () => ({
  CustomOverlayMap: ({ children, ...props }: { children: ReactNode }) => {
    captured.props = props;
    return <div data-testid="overlay-content">{children}</div>;
  },
}));

describe('AirspaceZoneOverlay 앵커', () => {
  afterEach(() => {
    cleanup();
    captured.props = undefined;
  });

  it('카카오의 크기 측정에 맡기지 않도록 가로·세로 앵커를 모두 0으로 둔다', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    expect(captured.props).toMatchObject({
      position: { lat: 37, lng: 127 },
      xAnchor: 0,
      yAnchor: 0,
    });
  });

  it('카카오가 측정하는 콘텐츠 크기를 0×0으로 둔다 (구역 이름 길이가 앵커 계산에 영향을 주지 않게)', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    const measuredRoot = screen.getByTestId('overlay-content').firstElementChild;

    expect(measuredRoot?.className).toContain('h-0');
    expect(measuredRoot?.className).toContain('w-0');
  });

  it('카드는 0×0 루트 안에서 절대 위치로 두고 자기 크기 기준(CSS)으로 가운데·위로 옮긴다', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    const card = screen.getByTestId('overlay-content').firstElementChild?.firstElementChild;

    expect(card?.className).toContain('absolute');
    expect(card?.className).toContain('bottom-0');
    expect(card?.className).toContain('left-0');
    // w-max: 0폭 컨테이너 안에서도 카드가 한 줄 폭으로 펴지게 한다.
    expect(card?.className).toContain('w-max');
    expect(card?.className).toContain('-translate-x-1/2');
  });

  it('구역 종류를 제목으로 보여 준다', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    expect(screen.getByText('관제권')).toBeDefined();
  });
});
