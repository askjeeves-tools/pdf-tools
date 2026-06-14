import { describe, expect, it } from "vitest";
import {
	detectFormat,
	formatLabel,
	getInputFormatIds,
	SUPPORTED_ACCEPT_ATTR,
} from "../src/catalog";

describe("catalog", () => {
	it("detects format from extension", () => {
		const file = new File([""], "photo.PNG", { type: "" });
		expect(detectFormat(file)).toBe("png");
	});

	it("detects format from mime type", () => {
		const file = new File([""], "data", { type: "application/pdf" });
		expect(detectFormat(file)).toBe("pdf");
	});

	it("returns null for unknown files", () => {
		const file = new File([""], "archive.zip", { type: "application/zip" });
		expect(detectFormat(file)).toBeNull();
	});

	it("formatLabel returns human-readable names", () => {
		expect(formatLabel("jpeg")).toBe("JPEG");
		expect(formatLabel("docx")).toBe("Word (DOCX)");
	});

	it("detects HEIC from extension and mime", () => {
		expect(detectFormat(new File([""], "photo.heic", { type: "" }))).toBe(
			"heic",
		);
		expect(detectFormat(new File([""], "photo.heif", { type: "" }))).toBe(
			"heic",
		);
		expect(
			detectFormat(new File([""], "photo.heic", { type: "image/heic" })),
		).toBe("heic");
	});

	it("SUPPORTED_ACCEPT_ATTR includes common extensions", () => {
		expect(SUPPORTED_ACCEPT_ATTR).toContain(".png");
		expect(SUPPORTED_ACCEPT_ATTR).toContain(".pdf");
		expect(SUPPORTED_ACCEPT_ATTR).toContain(".xlsx");
		expect(SUPPORTED_ACCEPT_ATTR).toContain(".heic");
	});

	it("getInputFormatIds returns unique input formats", () => {
		const ids = getInputFormatIds();
		expect(ids).toContain("png");
		expect(ids).toContain("pdf");
		expect(new Set(ids).size).toBe(ids.length);
	});
});
