import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

const { publicVars } = loadEnv({ prefixes: ['VITE_'] });

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  source: {
    define: publicVars,
  },
  server: {
    // VWorld API는 CORS를 지원하지 않아 개발 서버에서 프록시로 우회한다.
    // 프로덕션 배포 시에는 별도 프록시/서버가 필요하다 (ROADMAP.md TODO 참고).
    proxy: {
      '/api/vworld': {
        target: 'https://api.vworld.kr',
        changeOrigin: true,
        pathRewrite: { '^/api/vworld': '/req' },
      },
    },
  },
});
