/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { setStatus } from "../src/utils";

describe("setStatus", () => {
	it("sets polite live region for info", () => {
		const el = document.createElement("p");
		setStatus(el, "Ready.");
		expect(el.textContent).toBe("Ready.");
		expect(el.classList.contains("error")).toBe(false);
		expect(el.getAttribute("aria-live")).toBe("polite");
		expect(el.getAttribute("role")).toBeNull();
	});

	it("sets assertive alert for errors", () => {
		const el = document.createElement("p");
		setStatus(el, "Upload failed.", true);
		expect(el.classList.contains("error")).toBe(true);
		expect(el.getAttribute("aria-live")).toBe("assertive");
		expect(el.getAttribute("role")).toBe("alert");
	});
});
