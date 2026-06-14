import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fixturePath } from "@askjeeves/test-e2e/fixtures";
import {
	expectConvertPanelVisible,
	expectToolStatusError,
} from "@askjeeves/test-e2e/tool-flow";
import { test } from "@playwright/test";

test("wrong format upload shows error", async ({ page }) => {
	await page.goto("/");

	const badPath = join(fixturePath(".."), "fake-upload.png");

	await writeFile(badPath, "not a real png");

	try {
		await page.locator("#tool-file-input").setInputFiles(badPath);

		await expectToolStatusError(page, /PDF|unsupported|accept/i);

		await expectConvertPanelVisible(page, false);
	} finally {
		await unlink(badPath).catch(() => {});
	}
});

test("oversize upload shows error", async ({ page }) => {
	const bigPath = join(fixturePath(".."), "oversize.pdf");

	const big = Buffer.alloc(52_428_801, 0x25);

	const header = Buffer.from("%PDF-1.4\n");

	header.copy(big);

	try {
		await writeFile(bigPath, big);

		await page.goto("/");

		await page.locator("#tool-file-input").setInputFiles(bigPath);

		await expectToolStatusError(page, /too large/i);
	} finally {
		await unlink(bigPath).catch(() => {});
	}
});

test("merge with one file shows error", async ({ page }) => {
	await page.goto("/");

	await page
		.locator("#tool-file-input")
		.setInputFiles(fixturePath("page1.pdf"));

	await expectConvertPanelVisible(page, true);

	await page.getByRole("radio", { name: "Merge PDF" }).check();

	await page.locator("#tool-convert-btn").click();

	await expectToolStatusError(page, /at least 2 files/i);
});
