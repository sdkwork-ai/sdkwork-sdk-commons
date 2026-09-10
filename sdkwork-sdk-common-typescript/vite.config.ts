import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core/index.ts'),
        auth: resolve(__dirname, 'src/auth/index.ts'),
        http: resolve(__dirname, 'src/http/index.ts'),
        errors: resolve(__dirname, 'src/errors/index.ts'),
        utils: resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
  resolve: {
    // Resolve TypeScript sources before any stale compiled `*.js` emitted next
    // to them by a previous `tsc` run; otherwise Vite would bundle outdated
    // artifacts instead of the real source of truth.
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
