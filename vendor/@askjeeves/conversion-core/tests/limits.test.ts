import { describe, expect, it } from "vitest";
import {
	DEFAULT_MAX_FILE_BYTES,
	getMaxFileBytesForFormat,
	MAX_HEIC_FILE_BYTES,
} from "../src/limits";

describe("limits", () => {
	it("returns stricter cap for HEIC", () => {
		expect(getMaxFileBytesForFormat("heic")).toBe(MAX_HEIC_FILE_BYTES);
		expect(MAX_HEIC_FILE_BYTES).toBeLessThan(DEFAULT_MAX_FILE_BYTES);
	});

	it("returns default cap for other formats", () => {
		expect(getMaxFileBytesForFormat("png")).toBe(DEFAULT_MAX_FILE_BYTES);
		expect(getMaxFileBytesForFormat("docx")).toBe(DEFAULT_MAX_FILE_BYTES);
	});
});
