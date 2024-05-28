import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      exclude: [
        '**/**/*.module.ts',
        'infra/database/mongodb/auth/schemas',
        'src/infra/main.ts',
        '**/**/errors/**',
        'src/@types/**',
        '**/**/in-memory**',
        '**/**/fake-**',
        '**/test/**',
        '**/**/**spec**',
      ],
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
      isModule: true,
    }),
  ],
});
