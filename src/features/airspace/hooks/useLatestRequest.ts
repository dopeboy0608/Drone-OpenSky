import { useCallback, useEffect, useRef } from 'react';

// "마지막 요청만 반영" 장치. 연속 호출에서 늦게 도착한 이전 응답이 나중 요청의 결과를 덮어쓰지 않도록
// 요청마다 최신 여부를 확인할 수 있게 하고, 새 요청이 오면 이전 요청은 신호로 끊어 네트워크와 파싱을 아낀다.
export const useLatestRequest = () => {
  const latestRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 진행 중인 요청을 끊고, 이미 나간 요청이 최신으로 남지 않게 해서 늦게 도착한 결과도 무시하게 한다.
  // 호출하는 쪽이 더는 결과를 쓸 수 없게 됐을 때(예: 비활성화)가 대상이다.
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    latestRequestIdRef.current += 1;
  }, []);

  // 언마운트되면 진행 중인 요청을 끊는다.
  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const begin = useCallback(() => {
    abortControllerRef.current?.abort();
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    return {
      signal: controller.signal,
      isLatest: () => requestId === latestRequestIdRef.current,
    };
  }, []);

  return { begin, cancel };
};
