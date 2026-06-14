import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fixturePath } from "@askjeeves/test-e2e/fixtures";
import {
	expectConvertPanelVisible,
	expectToolStatusError,
} from "@askjeeves/test-e2e/tool-flow";
import { expect, test } from "@playwright/test";

test("corrupt PDF shows error on convert", async ({ page }) => {
	const corruptPath = join(fixturePath(".."), "corrupt.pdf");
	await writeFile(corruptPath, "%PDF-1.4\nthis is not a real pdf document");

	try {
		await page.goto("/");
		await page.locator("#tool-file-input").setInputFiles(corruptPath);
		await expectConvertPanelVisible(page, true);
		await page.locator("#tool-convert-btn").click();
		await expectToolStatusError(page, /PDF|valid|encrypted|damaged|failed/i);
	} finally {
		await unlink(corruptPath).catch(() => {});
	}
});
