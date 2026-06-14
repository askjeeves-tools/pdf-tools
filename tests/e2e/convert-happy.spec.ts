import { TOOL_MATRIX } from "@askjeeves/test-e2e/conversion-matrix";
import { runToolMatrixCase } from "@askjeeves/test-e2e/tool-flow";
import { test } from "@playwright/test";

const cases = TOOL_MATRIX["pdf-tools"] ?? [];

for (const testCase of cases) {
	test(`converts ${testCase.id}`, async ({ page }) => {
		await page.goto("/");
		await runToolMatrixCase(page, testCase);
	});
}
