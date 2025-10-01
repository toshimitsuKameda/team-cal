import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-files',
      closeBundle() {
        console.log('📦 静的ファイルのコピーを開始...');
        
        // distディレクトリを確実に作成
        mkdirSync('dist', { recursive: true });
        
        // manifest.jsonをコピー
        try {
          copyFileSync('public/manifest.json', 'dist/manifest.json');
          console.log('✅ manifest.jsonをコピーしました');
        } catch (err) {
          console.error('❌ manifest.jsonのコピーに失敗:', err);
          throw err;
        }
        
        // アイコンをコピー
        try {
          copyFileSync('public/icon16.png', 'dist/icon16.png');
          copyFileSync('public/icon48.png', 'dist/icon48.png');
          copyFileSync('public/icon128.png', 'dist/icon128.png');
          console.log('✅ アイコンをコピーしました');
        } catch (err) {
          console.warn('⚠️  アイコンのコピーに失敗（オプション）:', err);
        }
        
        console.log('✅ 静的ファイルのコピーが完了しました');
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.tsx'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

