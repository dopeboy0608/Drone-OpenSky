import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AirspaceClickPending } from '@/features/airspace/components/AirspaceClickPending';

const captured = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));

vi.mock('react-kakao-maps-sdk', () => ({
  CustomOverlayMap: ({ children, ...props }: { children: ReactNode }) => {
    captured.props = props;
    return <div data-testid="overlay-content">{children}</div>;
  },
}));

describe('AirspaceClickPending', () => {
  afterEach(() => {
    cleanup();
    captured.props = undefined;
  });

  it('클릭 좌표에 조회 중 표시를 올린다', () => {
    render(<AirspaceClickPending position={{ lat: 37, lng: 127 }} />);

    expect(captured.props).toMatchObject({ position: { lat: 37, lng: 127 } });
    expect(screen.getByRole('status', { name: '구역 조회 중' })).toBeDefined();
  });

  it('카카오가 측정하는 루트는 0×0으로 두고 표시는 그 중심에 맞춘다 (안내 박스와 같은 앵커 방식)', () => {
    render(<AirspaceClickPending position={{ lat: 37, lng: 127 }} />);

    const root = screen.getByTestId('overlay-content').firstElementChild;
    const indicator = root?.firstElementChild;

    expect(root?.className).toContain('h-0');
    expect(root?.className).toContain('w-0');
    expect(indicator?.className).toContain('absolute');
    expect(indicator?.className).toContain('-translate-x-1/2');
    expect(indicator?.className).toContain('-translate-y-1/2');
  });

  it('지도 클릭을 가로채지 않도록 포인터 이벤트를 받지 않는다', () => {
    render(<AirspaceClickPending position={{ lat: 37, lng: 127 }} />);

    expect(screen.getByRole('status', { name: '구역 조회 중' }).className).toContain(
      'pointer-events-none',
    );
  });

  it('원형을 유지하도록 가로·세로 크기를 같은 값으로 고정한다 (0폭 부모에서 타원으로 쪼그라드는 것 방지)', () => {
    render(<AirspaceClickPending position={{ lat: 37, lng: 127 }} />);

    const { className } = screen.getByRole('status', { name: '구역 조회 중' });

    expect(className).toContain('h-8');
    expect(className).toContain('w-8');
    expect(className).toContain('rounded-full');
  });
});
