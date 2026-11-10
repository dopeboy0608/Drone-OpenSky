// 전국 공역 데이터(~50MB)를 그룹당 하루 한 번 이상 재다운로드하지 않도록 기본 staleTime을 넉넉히 잡는다 (이슈 #37).
export const DEFAULT_STALE_TIME_MS = 24 * 60 * 60 * 1000;

// 24시간 만료는 실제로 기다려야만 확인되므로, 빌드 환경변수로 1~3분처럼 짧게 덮어써 재조회를 검증할 수 있게 한다 (이슈 #68).
// 잘못된 값(비숫자, 0 이하)이 들어와도 캐시가 매번 만료되어 대용량 재다운로드가 반복되지 않도록 기본값으로 돌아간다.
export const resolveStaleTimeMs = (raw: string | undefined): number => {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_STALE_TIME_MS;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STALE_TIME_MS;
};
