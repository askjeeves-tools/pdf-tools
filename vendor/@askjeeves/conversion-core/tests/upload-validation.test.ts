import { describe, expect, it } from "vitest";
import { DEFAULT_MAX_FILE_BYTES, MAX_HEIC_FILE_BYTES } from "../src/limits";
import { validateUploadFiles } from "../src/upload-validation";

function file(name: string, body: string | Uint8Array, type = ""): File {
	const data = typeof body === "string" ? new TextEncoder().encode(body) : body;
	return new File([data], name, { type });
}

describe("validateUploadFiles", () => {
	it("rejects mislabeled pdf at upload", async () => {
		const result = await validateUploadFiles(
			[file("report.pdf", "plain text", "application/pdf")],
			{ maxBytes: DEFAULT_MAX_FILE_BYTES },
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("report.pdf");
			expect(result.error).toContain("valid PDF");
		}
	});

	it("enforces heic size cap", async () => {
		const big = new Uint8Array(MAX_HEIC_FILE_BYTES + 1);
		const f = file("big.heic", big, "image/heic");
		const result = await validateUploadFiles([f], {
			maxBytes: DEFAULT_MAX_FILE_BYTES,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain("too large");
	});

	it("rejects wrong format when expectedFormat is set", async () => {
		const result = await validateUploadFiles(
			[file("data.json", '[{"a":1}]', "application/json")],
			{ maxBytes: DEFAULT_MAX_FILE_BYTES, expectedFormat: "csv" },
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("CSV");
		}
	});

	it("accepts valid csv when expectedFormat is csv", async () => {
		const result = await validateUploadFiles(
			[file("data.csv", "name,count\na,1", "text/csv")],
			{ maxBytes: DEFAULT_MAX_FILE_BYTES, expectedFormat: "csv" },
		);
		expect(result.ok).toBe(true);
	});
});
