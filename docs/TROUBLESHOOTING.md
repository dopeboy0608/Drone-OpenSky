# 트러블슈팅 로그

디버깅, 원인 조사, 기술적 의사결정 과정을 기록한다. 포맷과 기록 기준은 [CLAUDE.md](../CLAUDE.md#트러블슈팅-로그) 참고.

## 2026-09-20 09:56 — TypeScript를 @typescript/native-preview(tsgo)로 완전 교체할 수 없는 이유

- 증상: TypeScript 7 네이티브 프리뷰(tsgo)를 체험 도입하면서, 기존 `typescript` devDependency를 `@typescript/native-preview`로 완전히 교체할 수 있는지 검토했다.
- 원인: `typescript-eslint`(및 그 위의 ESLint 파싱)는 `typescript` 패키지가 제공하는 JS 컴파일러 API(`createProgram` 등)를 직접 import해서 사용한다. `@typescript/native-preview`는 이 API를 제공하지 않는 별개의 Go 네이티브 바이너리(`tsgo` CLI)라, `typescript`를 이걸로 대체하면 eslint가 필요로 하는 모듈 자체가 사라져 깨진다.
- 해결/결론: 완전 교체는 시도하지 않고, 기존 `typescript(^6.0.3)`은 유지한 채 `@typescript/native-preview`를 devDependency로 병행 추가했다. `pnpm typecheck:tsgo` 스크립트(`tsgo --noEmit -p tsconfig.json`)로만 수동 체험하며, 빌드(`pnpm build`)·린트(`pnpm lint`)·에디터 설정은 건드리지 않는다. 참고로 현재 `pnpm build`는 rsbuild/SWC 기반이라 애초에 타입체크 단계가 없어, tsgo 도입 여부와 무관하게 빌드 속도에는 영향이 없다.
- 관련 이슈/PR: #17, #19
