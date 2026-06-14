import { describe, expect, it } from "vitest";
import { formatBatchLabel, validateFileBatch } from "../src/file-batch";

function file(name: string, type = ""): File {
	return new File(["x"], name, { type });
}

describe("validateFileBatch", () => {
	it("rejects empty batch", () => {
		const result = validateFileBatch([]);
		expect(result.ok).toBe(false);
	});

	it("accepts single supported file", () => {
		const result = validateFileBatch([file("photo.png", "image/png")]);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.format).toBe("png");
	});

	it("accepts heic files", () => {
		const result = validateFileBatch([file("photo.heic", "image/heic")]);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.format).toBe("heic");
	});

	it("rejects mixed types", () => {
		const result = validateFileBatch([
			file("a.pdf", "application/pdf"),
			file("b.png", "image/png"),
		]);
		expect(result.ok).toBe(false);
	});

	it("accepts multiple files of same type", () => {
		const result = validateFileBatch([
			file("one.pdf", "application/pdf"),
			file("two.pdf", "application/pdf"),
		]);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.format).toBe("pdf");
	});
});

describe("formatBatchLabel", () => {
	it("singular label for one file", () => {
		expect(formatBatchLabel("png", 1)).toBe("PNG");
	});

	it("count prefix for multiple", () => {
		expect(formatBatchLabel("pdf", 3)).toBe("3 × PDF");
	});
});
