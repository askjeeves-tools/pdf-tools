import { describe, expect, it } from "vitest";
import { sniffFileContent } from "../src/sniff";

function file(name: string, bytes: Uint8Array | string, type = ""): File {
	const data =
		typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
	return new File([data], name, { type });
}

describe("sniffFileContent", () => {
	it("accepts pdf header", async () => {
		const f = file("doc.pdf", "%PDF-1.4\n", "application/pdf");
		expect(await sniffFileContent(f, "pdf")).toBeNull();
	});

	it("rejects text as pdf", async () => {
		const f = file("fake.pdf", "not a pdf file", "application/pdf");
		expect(await sniffFileContent(f, "pdf")).toMatch(/valid PDF/);
	});

	it("accepts zip header for docx", async () => {
		const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
		const f = file("doc.docx", bytes);
		expect(await sniffFileContent(f, "docx")).toBeNull();
	});

	it("rejects plain text as docx", async () => {
		const f = file("fake.docx", "hello");
		expect(await sniffFileContent(f, "docx")).toMatch(/Word document/);
	});

	it("accepts valid json", async () => {
		const f = file("data.json", '[{"a":1}]', "application/json");
		expect(await sniffFileContent(f, "json")).toBeNull();
	});

	it("rejects invalid json", async () => {
		const f = file("bad.json", "{not json", "application/json");
		expect(await sniffFileContent(f, "json")).toMatch(/valid JSON/);
	});
});
