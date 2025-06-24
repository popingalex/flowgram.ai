import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts', // 只匹配我们的测试文件
  timeout: 60 * 1000, // 增加超时时间，因为实体管理页面可能需要更多时间加载
  retries: 1,
  workers: 1, // 使用单个worker便于调试
  reporter: [['list'], ['html']], // 同时使用list和html报告器
  use: {
    baseURL: 'http://localhost:13000',
    headless: false, // 设为false方便调试，可以看到页面操作
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 增加操作超时时间
    navigationTimeout: 30000, // 增加导航超时时间
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
