import { describe, expect, it } from "vitest";
import { validateOptionsBeforeConvert } from "../src/option-validators";
import type { ConversionDefinition } from "../src/types";

function conversion(
	id: string,
	options: ConversionDefinition["options"] = "none",
): ConversionDefinition {
	return {
		id,
		source: "pdf",
		target: "pdf",
		label: id,
		enabled: true,
		options,
	};
}

function file(name: string, size: number): File {
	return new File([new Uint8Array(size)], name);
}

describe("validateOptionsBeforeConvert", () => {
	it("requires two files for pdf-merge", () => {
		const result = validateOptionsBeforeConvert(
			conversion("pdf-merge"),
			[file("a.pdf", 100)],
			{},
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("at least 2 files");
		}
	});

	it("rejects invalid page range", () => {
		const result = validateOptionsBeforeConvert(
			conversion("pdf-split", "pdf"),
			[file("a.pdf", 100)],
			{ pageFrom: 5, pageTo: 2 },
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("start must be ≤ end");
		}
	});

	it("rejects docx-pdf over size limit", () => {
		const result = validateOptionsBeforeConvert(
			conversion("docx-pdf"),
			[file("big.docx", 11 * 1024 * 1024)],
			{},
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("Word → PDF");
		}
	});

	it("rejects crop area smaller than 1px", () => {
		const result = validateOptionsBeforeConvert(
			conversion("png-crop", "image"),
			[file("a.png", 100)],
			{ cropWidth: 0, cropHeight: 10 },
		);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("1×1");
		}
	});

	it("passes for simple conversion with valid input", () => {
		const result = validateOptionsBeforeConvert(
			conversion("csv-json"),
			[file("a.csv", 100)],
			{},
		);
		expect(result.ok).toBe(true);
	});
});
