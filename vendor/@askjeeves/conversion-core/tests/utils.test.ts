import { describe, expect, it } from "vitest";
import { assertNonEmptyBlob } from "../src/option-validators";
import { basename, formatBytes } from "../src/utils";

describe("utils", () => {
	it("basename strips extension", () => {
		expect(basename("report.final.pdf")).toBe("report.final");
		expect(basename("noext")).toBe("noext");
	});

	it("formatBytes formats sizes", () => {
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(2048)).toBe("2.0 KB");
		expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
	});
});

describe("assertNonEmptyBlob", () => {
	it("throws for empty blob", () => {
		expect(() => assertNonEmptyBlob(new Blob([]))).toThrow(/empty file/i);
	});

	it("passes for non-empty blob", () => {
		expect(() => assertNonEmptyBlob(new Blob(["x"]))).not.toThrow();
	});
});
