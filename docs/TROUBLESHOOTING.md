# 트러블슈팅 로그

디버깅, 원인 조사, 기술적 의사결정 과정을 기록한다. 포맷과 기록 기준은 [CLAUDE.md](../CLAUDE.md#트러블슈팅-로그) 참고.

## 2026-09-20 09:56 — TypeScript를 @typescript/native-preview(tsgo)로 완전 교체할 수 없는 이유

- 증상: TypeScript 7 네이티브 프리뷰(tsgo)를 체험 도입하면서, 기존 `typescript` devDependency를 `@typescript/native-preview`로 완전히 교체할 수 있는지 검토했다.
- 원인: `typescript-eslint`(및 그 위의 ESLint 파싱)는 `typescript` 패키지가 제공하는 JS 컴파일러 API(`createProgram` 등)를 직접 import해서 사용한다. `@typescript/native-preview`는 이 API를 제공하지 않는 별개의 Go 네이티브 바이너리(`tsgo` CLI)라, `typescript`를 이걸로 대체하면 eslint가 필요로 하는 모듈 자체가 사라져 깨진다.
- 해결/결론: 완전 교체는 시도하지 않고, 기존 `typescript(^6.0.3)`은 유지한 채 `@typescript/native-preview`를 devDependency로 병행 추가했다. `pnpm typecheck:tsgo` 스크립트(`tsgo --noEmit -p tsconfig.json`)로만 수동 체험하며, 빌드(`pnpm build`)·린트(`pnpm lint`)·에디터 설정은 건드리지 않는다. 참고로 현재 `pnpm build`는 rsbuild/SWC 기반이라 애초에 타입체크 단계가 없어, tsgo 도입 여부와 무관하게 빌드 속도에는 영향이 없다.
- 관련 이슈/PR: #17, #19
- **후속(#21/#22 참고)**: 이후 `typescript@latest`가 7.0.2로 정식 출시된 것을 확인. 정식 7.0 패키지 자체가 네이티브 Go 컴파일러이고 클래식 프로그래매틱 API가 아예 없음(7.1 예정)을 확인해, 위 결론(병행 유지)은 폐기하고 ESLint 스택을 완전히 제거 + Biome 도입 + `typescript@^7.0.2` 정식 전환으로 재결정했다. 아래 항목 참고.

## 2026-09-20 10:32 — TypeScript 7 정식(7.0.2)에 클래식 컴파일러 API가 없어 typescript-eslint를 근본적으로 못 씀

- 증상: `typescript@latest`가 7.0.2(정식)로 이미 출시된 것을 확인. ESLint를 Biome으로 교체하면 TS7을 "온전히" 쓸 수 있는지 검토하다가, 실제로 7.0.2 패키지 구조를 npm 레지스트리에서 직접 받아 뜯어봄.
- 원인: `typescript@7.0.2`의 `package.json` `exports` 맵에서 메인 엔트리가 `./lib/version.cjs`(버전 정보만)이고, `createProgram`/`SourceFile`/`SyntaxKind` 같은 클래식 컴파일러 API가 전혀 없다. 대신 `./unstable/sync`, `./unstable/async` 같은 새 RPC 스타일 API만 노출된다. TypeScript 공식 발표에서도 "프로그래매틱 API는 7.1에서 제공 예정"이라고 명시. `typescript-eslint`(`@typescript-eslint/typescript-estree`)는 이 클래식 API에 직접 의존하므로, peer 버전 범위(`<6.1.0`) 문제 이전에 애초에 API가 없어서 구조적으로 동작할 수 없다.
- 해결/결론: ESLint(+typescript-eslint) 전체 제거, Biome을 린트 전용으로 도입(포매터는 Prettier 유지 — Biome이 YAML 미지원이라 `.github/workflows/*.yml` 포맷 대상에서 빠지는 문제가 있었음). `typescript`를 `^7.0.2`로 정식 전환. `@typescript/native-preview`(위 항목의 병행 구성)는 정식 출시로 의미가 없어져 devDependency에서 제거. Biome 전환 과정에서 새로 걸린 두 건(`Map` 전역 shadowing → `KakaoMap` 별칭, 정적 GeoJSON 목록의 배열 인덱스 키 → `biome-ignore` 사유 명시)도 함께 정리.
- 관련 이슈/PR: #21, #22 (#17, #19 대체)
