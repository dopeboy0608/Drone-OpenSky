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

  it('꼬리 끝이 클릭 좌표에 오도록 자기 크기 기준(CSS)으로 가운데·위로 옮긴다', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    const wrapper = screen.getByTestId('overlay-content').firstElementChild;

    expect(wrapper?.className).toContain('-translate-x-1/2');
    expect(wrapper?.className).toContain('-translate-y-full');
  });

  it('구역 종류를 제목으로 보여 준다', () => {
    render(
      <AirspaceZoneOverlay position={{ lat: 37, lng: 127 }} zoneType="관제권" onClose={vi.fn()} />,
    );

    expect(screen.getByText('관제권')).toBeDefined();
  });
});
