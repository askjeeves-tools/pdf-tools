import { describe, expect, it } from "vitest";
import { throwIfAborted } from "../src/utils";

describe("throwIfAborted", () => {
	it("does nothing when signal is undefined", () => {
		expect(() => throwIfAborted(undefined)).not.toThrow();
	});

	it("does nothing when signal is not aborted", () => {
		const controller = new AbortController();
		expect(() => throwIfAborted(controller.signal)).not.toThrow();
	});

	it("throws AbortError when signal is aborted", () => {
		const controller = new AbortController();
		controller.abort();
		try {
			throwIfAborted(controller.signal);
			expect.fail("expected throw");
		} catch (err) {
			expect(err).toBeInstanceOf(DOMException);
			expect((err as DOMException).name).toBe("AbortError");
		}
	});
});
