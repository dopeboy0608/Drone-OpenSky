# 스펙: VWorld CORS 우회용 프록시

> **후속(2026-09-20)**: 아래는 최초 계획(Cloudflare Worker 단일 relay)이다. 실제 구현 중
> VWorld가 Cloudflare 등 해외 클라우드 엣지 IP를 차단하는 것을 확인해(520 재현,
> [TROUBLE_SHOOTING.md](../TROUBLE_SHOOTING.md) 참고), relay는 Vercel 서버리스 함수(서울
> 리전 `icn1` 고정, `server/api/vworld-api/[...path].ts`)로 최종 변경했다. Cloudflare
> Worker(`wrangler.toml`)는 정적 자산(프론트엔드 이중 배포) 전용으로 역할이 축소됐다. 아래
> "기대 동작"의 "Worker"는 최종적으로 "Vercel relay 함수"로, `/vworld-api/*`는
> `/api/vworld-api/*`로 읽는다.

## 배경/목적

프로덕션(GitHub Pages 정적 호스팅)에서 브라우저가 VWorld WFS API를 직접 호출하면 CORS로 막힌다.
VWorld가 브라우저 요청에 CORS 헤더를 내려주지 않기 때문이며, 운영키 재발급으로는 해결되지 않는다.
상태 없는 Cloudflare Worker를 중계 프록시로 두어, VWorld API 키 주입과 CORS 헤더 추가를 Worker가
대신 처리한다.

추가로, 프론트엔드 빌드를 GitHub Pages와 Cloudflare Workers(정적 자산 서빙) 두 곳에 함께 배포하기로
했다 (사용자 결정, 2026-09-20). 하나의 Worker 프로젝트가 (1) 정적 자산 서빙과 (2) VWorld relay API를
모두 처리한다 — `run_worker_first`로 `/vworld-api/*` 경로만 Worker 스크립트를 거치고, 나머지 경로는
Workers 정적 자산이 직접 응답한다.

## 입력

- 프론트엔드(`vworldClient`)가 보내는 `GET /vworld-api/<vworld-req-경로>?<query>` 요청
  (예: `/vworld-api/wfs?SERVICE=WFS&...`)
- Worker 환경변수(시크릿) `VWORLD_API_KEY`

## 기대 동작

- [x] `/vworld-api/*` 요청을 `https://api.vworld.kr/req/*`로 그대로 relay하고, query에 `key`를
      Worker가 주입한다 (프론트엔드는 key를 넘기지 않는다)
- [x] VWorld 응답(status, body, content-type)을 그대로 반환한다
- [x] 응답에 `Access-Control-Allow-Origin` 헤더를 추가한다 — GitHub Pages 도메인
      (`https://dopeboy0608.github.io`)과 Worker 자체 도메인
      (`https://drone-opensky.dopeboy0608.workers.dev`)만 허용 (와일드카드 금지)
- [x] `OPTIONS` preflight 요청에 204 + CORS 헤더로 응답한다
- [x] `/vworld-api/*`가 아닌 나머지 경로는 Worker 스크립트를 거치지 않고 정적 자산(`dist/`)을 그대로
      서빙한다 (SPA fallback 포함)

## 엣지케이스

- [ ] 허용되지 않은 Origin에서의 요청 → `Access-Control-Allow-Origin` 미설정(빈 값)으로 브라우저가
      차단하도록 둔다
- [ ] VWorld가 에러(XML `ServiceExceptionReport`, JSON `status: ERROR`)를 HTTP 200으로 반환하는 경우
      → Worker는 그대로 relay만 하고, 에러 판별은 기존처럼 프론트엔드 `vworldClient` 인터셉터가 담당
- [ ] VWorld 자체가 네트워크 오류/타임아웃일 때 → Worker가 5xx로 응답

## 범위 밖

- 좌표 기반 폴리곤 조회(지도 클릭) 엔드포인트/파라미터 확정 — 추후 별도 논의
- Worker의 GitHub Actions 자동 배포 통합 (선택 사항, 별도 결정 시 진행)
- 로그인/게시글 등 서버 고도화 (MVP 이후 별도 계획)

## 관련 이슈

#16
