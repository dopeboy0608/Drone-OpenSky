export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// 카카오 타일은 Web Mercator가 아니라 WCONGNAMUL 좌표에 정확히 선형이다(레벨 3~13 실측, 이슈 #28).
// 그래서 Web Mercator 타일 공식을 쓰면 레벨 7에서 약 12m, 레벨 13에서 약 6% 어긋난다.
const BASE_TILE_SIZE = 80;
const ORIGIN_X = -75000;
const ORIGIN_Y = -150000;

export const tileToWcongBounds = (x: number, y: number, z: number): Bounds => {
  const size = BASE_TILE_SIZE * 2 ** z;
  const minX = ORIGIN_X + size * x;
  const minY = ORIGIN_Y + size * y;

  return { minX, minY, maxX: minX + size, maxY: minY + size };
};
