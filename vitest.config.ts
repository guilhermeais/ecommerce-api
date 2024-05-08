import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    passWithNoTests: true,
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
      isModule: true,
    }),
  ],
});
