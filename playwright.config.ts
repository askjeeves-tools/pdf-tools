import { defineConfig, devices } from "@playwright/test";

const PORT = 4332;

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: false,
	retries: 0,
	workers: 1,
	timeout: 120_000,
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], channel: "chrome" },
		},
	],
	webServer: {
		command: `npx astro preview --port ${PORT} --host 127.0.0.1`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
