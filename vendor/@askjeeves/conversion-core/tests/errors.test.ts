import { describe, expect, it } from "vitest";
import {
	conversionError,
	conversionErrorUnlessUserError,
	getErrorMessage,
	mapIdbError,
	UserFacingError,
	userFacingError,
	withConversionError,
} from "../src/errors";

describe("getErrorMessage", () => {
	it("reads Error message", () => {
		expect(getErrorMessage(new Error("oops"))).toBe("oops");
	});

	it("reads string errors", () => {
		expect(getErrorMessage("bad")).toBe("bad");
	});

	it("uses fallback for unknown", () => {
		expect(getErrorMessage(null, "fallback")).toBe("fallback");
	});
});

describe("UserFacingError", () => {
	it("is preserved by conversionErrorUnlessUserError", () => {
		const original = userFacingError(
			"Page range invalid: start must be ≤ end.",
		);
		expect(conversionErrorUnlessUserError("pdf", original)).toBe(original);
	});

	it("is preserved through withConversionError", async () => {
		const original = userFacingError("Custom limit message.");
		await expect(
			withConversionError("pdf", async () => {
				throw original;
			}),
		).rejects.toBe(original);
	});
});

describe("conversionError", () => {
	it("returns user-facing pdf message", () => {
		const err = conversionError("pdf", new Error("Invalid object ref"));
		expect(err.message).toContain("valid PDF");
	});
});

describe("withConversionError", () => {
	it("wraps library failures", async () => {
		await expect(
			withConversionError("json", async () => {
				throw new SyntaxError("Unexpected token");
			}),
		).rejects.toThrow(/valid JSON/);
	});
});

describe("mapIdbError", () => {
	it("maps QuotaExceededError", () => {
		const err = mapIdbError(new DOMException("quota", "QuotaExceededError"));
		expect(err.message).toContain("Storage is full");
	});

	it("maps SecurityError", () => {
		const err = mapIdbError(new DOMException("blocked", "SecurityError"));
		expect(err.message).toContain("blocked");
	});

	it("uses generic fallback", () => {
		const err = mapIdbError(new Error("unknown"));
		expect(err.message).toContain("Could not access file storage");
	});

	it("returns UserFacingError instances", () => {
		expect(mapIdbError(null)).toBeInstanceOf(UserFacingError);
	});
});
