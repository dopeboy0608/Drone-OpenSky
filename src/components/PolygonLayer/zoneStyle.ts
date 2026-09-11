import type { ZoneType } from '../../api/droneZones';

interface ZoneStyle {
  label: string;
  strokeColor: string;
  fillColor: string;
}

export const ZONE_STYLE: Record<ZoneType, ZoneStyle> = {
  available: { label: '비행가능구역', strokeColor: '#22c55e', fillColor: '#22c55e' },
  restricted: { label: '비행제한구역', strokeColor: '#9ca3af', fillColor: '#9ca3af' },
  prohibited: { label: '비행금지구역', strokeColor: '#ef4444', fillColor: '#ef4444' },
};

export const ZONE_FILL_OPACITY = 0.35;
export const ZONE_STROKE_OPACITY = 0.8;
