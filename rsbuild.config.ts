import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import path from 'node:path';

const { publicVars } = loadEnv({ prefixes: ['VITE_'] });

// GitHub Pages 프로젝트 페이지 서브경로 배포 대응 (예: /Drone-OpenSky/). 로컬/기본 배포는 '/'.
const basePath = process.env.GH_PAGES_BASE_PATH || '/';

// 커스텀 도메인 연결 전까지 GitHub Pages 기본 URL을 canonical/OG URL로 사용.
const siteUrl = 'https://dopeboy0608.github.io/Drone-OpenSky/';

const siteTitle = 'Drone-OpenSky';
const siteDescription = '드론 비행 가능/제한/불가 구역을 실시간 지도 기반으로 제공하는 서비스';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  source: {
    define: {
      ...publicVars,
      'import.meta.env.VITE_BASE_PATH': JSON.stringify(basePath),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    assetPrefix: basePath,
  },
  server: {
    base: basePath,
  },
  html: {
    title: siteTitle,
    meta: {
      description: siteDescription,
      // 아직 개발 초기 단계(1단계 범위)라 색인은 보류. 정식 공개 시 제거.
      robots: 'noindex, nofollow',
      'og:title': { property: 'og:title', content: siteTitle },
      'og:description': { property: 'og:description', content: siteDescription },
      'og:type': { property: 'og:type', content: 'website' },
      'og:url': { property: 'og:url', content: siteUrl },
      'og:locale': { property: 'og:locale', content: 'ko_KR' },
      'twitter:card': { name: 'twitter:card', content: 'summary' },
      'twitter:title': { name: 'twitter:title', content: siteTitle },
      'twitter:description': { name: 'twitter:description', content: siteDescription },
    },
    tags: [
      {
        tag: 'link',
        attrs: { rel: 'canonical', href: siteUrl },
      },
    ],
  },
});
