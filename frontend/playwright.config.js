import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Ebben a mappában keresi majd a teszteket
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // A frontend URL-je (fejlesztéskor 5173, dockerben 80)
    baseURL: 'http://localhost:5173', 
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Automatikusan elindítja a szervert tesztelés előtt (opcionális, ha már fut)
  /* webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  */
});