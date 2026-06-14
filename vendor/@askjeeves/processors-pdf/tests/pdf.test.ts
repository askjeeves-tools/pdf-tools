import { describe, expect, it } from "vitest";
import { parsePageRange, parsePagesToKeep } from "../src/pdf";

describe("parsePageRange", () => {
	it("returns zero-based indices for a valid range", () => {
		expect(parsePageRange(1, 3, 10)).toEqual([0, 1, 2]);
	});

	it("defaults pageTo to total when omitted", () => {
		expect(parsePageRange(2, undefined, 5)).toEqual([1, 2, 3, 4]);
	});

	it("throws when start is after end", () => {
		expect(() => parsePageRange(5, 2, 10)).toThrow(/invalid/i);
	});

	it("throws when range exceeds MAX_PDF_PAGES", () => {
		expect(() => parsePageRange(1, 100, 100)).toThrow(/maximum/i);
	});
});

describe("parsePagesToKeep", () => {
	it("returns indices not in the removal range", () => {
		expect(parsePagesToKeep(2, 3, 5)).toEqual([0, 3, 4]);
	});

	it("throws when all pages would be removed", () => {
		expect(() => parsePagesToKeep(1, 5, 5)).toThrow(/all pages/i);
	});
});
