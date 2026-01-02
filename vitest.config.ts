import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: [
      // 1. 处理 @ 别名
      { find: '@', replacement: path.resolve(__dirname, './src') },
      
      // 2. 使用正则批量拦截带版本号的导入语句
      // 只要匹配到 "包名@数字.数字.数字"，就自动去掉后缀
      {
        find: /^(.+)@\d+(\.\d+)*$/,
        replacement: '$1'
      }
    ],
  },
});