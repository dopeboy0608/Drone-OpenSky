import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import path from 'node:path';

const { publicVars } = loadEnv({ prefixes: ['VITE_'] });

// GitHub Pages 프로젝트 페이지 서브경로 배포 대응 (예: /Drone-OpenSky/). 로컬/기본 배포는 '/'.
const basePath = process.env.GH_PAGES_BASE_PATH || '/';

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
});
