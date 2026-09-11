import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
});
