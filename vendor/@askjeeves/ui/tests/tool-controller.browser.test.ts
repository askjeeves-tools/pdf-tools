/** @vitest-environment happy-dom */

import { createToolConfig, userFacingError } from "@askjeeves/conversion-core";
import { describe, expect, it, vi } from "vitest";
import { initToolController } from "../scripts/tool-controller";

const CSV_CONFIG = createToolConfig({
	id: "test-csv",
	title: "Test CSV",
	tagline: "Test",
	sourceFormat: "csv",
	conversions: [
		{
			id: "csv-json",
			source: "csv",
			target: "json",
			label: "CSV → JSON",
			enabled: true,
			options: "none",
		},
	],
});

function buildShell(): HTMLElement {
	document.body.innerHTML = `
		<div id="converter-root">
			<div id="tool-drop-zone"></div>
			<input id="tool-file-input" type="file" hidden />
			<p id="tool-file-name"></p>
			<div id="tool-convert-panel" class="hidden">
				<div id="tool-method-list"></div>
				<button id="tool-convert-btn" type="button" disabled>Convert</button>
				<button id="tool-cancel-btn" type="button" class="hidden">Cancel</button>
			</div>
			<progress id="tool-progress" class="hidden" max="100"></progress>
			<p id="tool-progress-label"></p>
			<p id="tool-status"></p>
			<a id="tool-download" class="hidden" download>Download</a>
		</div>
	`;
	return document.getElementById("converter-root")!;
}

function csvFile(name = "sample.csv"): File {
	return new File(["name,count\na,1"], name, { type: "text/csv" });
}

describe("initToolController", () => {
	it("hides convert panel on load", () => {
		const root = buildShell();
		initToolController(root, CSV_CONFIG, {}, 52_428_800);
		expect(
			root.querySelector("#tool-convert-panel")!.classList.contains("hidden"),
		).toBe(true);
	});

	it("shows panel after valid upload", async () => {
		const root = buildShell();
		initToolController(root, CSV_CONFIG, {}, 52_428_800);

		const input = root.querySelector<HTMLInputElement>("#tool-file-input")!;
		const dt = new DataTransfer();
		dt.items.add(csvFile());
		input.files = dt.files;
		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-convert-panel")!.classList.contains("hidden"),
			).toBe(false);
		});
		expect(root.querySelector("#tool-file-name")!.textContent).toContain(
			"sample.csv",
		);
	});

	it("shows error and hides panel for wrong format", async () => {
		const root = buildShell();
		initToolController(root, CSV_CONFIG, {}, 52_428_800);

		const input = root.querySelector<HTMLInputElement>("#tool-file-input")!;
		const dt = new DataTransfer();
		dt.items.add(
			new File(["not pdf"], "fake.pdf", { type: "application/pdf" }),
		);
		input.files = dt.files;
		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-status")!.classList.contains("error"),
			).toBe(true);
		});
		expect(
			root.querySelector("#tool-convert-panel")!.classList.contains("hidden"),
		).toBe(true);
	});

	it("shows download link after successful conversion", async () => {
		const root = buildShell();
		const processors = {
			"csv-json": vi.fn(async () => ({
				blob: new Blob(['[{"a":1}]'], { type: "application/json" }),
				filename: "sample.json",
				mimeType: "application/json",
			})),
		};
		initToolController(root, CSV_CONFIG, processors, 52_428_800);

		const input = root.querySelector<HTMLInputElement>("#tool-file-input")!;
		const dt = new DataTransfer();
		dt.items.add(csvFile());
		input.files = dt.files;
		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-convert-btn")!.hasAttribute("disabled"),
			).toBe(false);
		});

		root.querySelector<HTMLButtonElement>("#tool-convert-btn")!.click();

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-download")!.classList.contains("hidden"),
			).toBe(false);
		});
		expect(root.querySelector("#tool-status")!.textContent).toMatch(
			/ready to download/i,
		);
	});

	it("surfaces UserFacingError from processor", async () => {
		const root = buildShell();
		const processors = {
			"csv-json": vi.fn(async () => {
				throw userFacingError("Custom processor error.");
			}),
		};
		initToolController(root, CSV_CONFIG, processors, 52_428_800);

		const input = root.querySelector<HTMLInputElement>("#tool-file-input")!;
		const dt = new DataTransfer();
		dt.items.add(csvFile());
		input.files = dt.files;
		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-convert-btn")!.hasAttribute("disabled"),
			).toBe(false);
		});

		root.querySelector<HTMLButtonElement>("#tool-convert-btn")!.click();

		await vi.waitFor(() => {
			expect(root.querySelector("#tool-status")!.textContent).toBe(
				"Custom processor error.",
			);
		});
		expect(
			root.querySelector("#tool-status")!.classList.contains("error"),
		).toBe(true);
	});

	it("surfaces unhandled rejection in status", async () => {
		const root = buildShell();
		initToolController(root, CSV_CONFIG, {}, 52_428_800);

		const event = new Event("unhandledrejection");
		Object.defineProperty(event, "reason", {
			value: new Error("unexpected"),
		});
		window.dispatchEvent(event);

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-status")!.classList.contains("error"),
			).toBe(true);
		});
		expect(root.querySelector("#tool-status")!.textContent).toBe("unexpected");
	});

	it("shows cancelled message when user aborts a slow conversion", async () => {
		const root = buildShell();
		const processors = {
			"csv-json": vi.fn(
				(_file, _opts, context) =>
					new Promise((_resolve, reject) => {
						const timer = setInterval(() => {
							if (context?.signal?.aborted) {
								clearInterval(timer);
								reject(
									new DOMException("The operation was aborted.", "AbortError"),
								);
							}
						}, 20);
					}),
			),
		};
		initToolController(root, CSV_CONFIG, processors, 52_428_800);

		const input = root.querySelector<HTMLInputElement>("#tool-file-input")!;
		const dt = new DataTransfer();
		dt.items.add(csvFile());
		input.files = dt.files;
		input.dispatchEvent(new Event("change"));

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-convert-btn")!.hasAttribute("disabled"),
			).toBe(false);
		});

		root.querySelector<HTMLButtonElement>("#tool-convert-btn")!.click();

		await vi.waitFor(() => {
			expect(
				root.querySelector("#tool-cancel-btn")!.classList.contains("hidden"),
			).toBe(false);
		});

		root.querySelector<HTMLButtonElement>("#tool-cancel-btn")!.click();

		await vi.waitFor(() => {
			expect(root.querySelector("#tool-status")!.textContent).toBe(
				"Conversion cancelled.",
			);
		});
	});
});
