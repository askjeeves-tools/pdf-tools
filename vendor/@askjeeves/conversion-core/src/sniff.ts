import type { FormatId } from "./types";

const SNIFF_BYTES = 12;

async function readHead(file: File, length = SNIFF_BYTES): Promise<Uint8Array> {
	const slice = file.slice(0, length);
	return new Uint8Array(await slice.arrayBuffer());
}

function bytesStartWith(bytes: Uint8Array, signature: number[]): boolean {
	if (bytes.length < signature.length) return false;
	return signature.every((b, i) => bytes[i] === b);
}

function bytesIncludeAscii(
	bytes: Uint8Array,
	text: string,
	offset = 0,
): boolean {
	const sig = new TextEncoder().encode(text);
	if (bytes.length < offset + sig.length) return false;
	for (let i = 0; i < sig.length; i++) {
		if (bytes[offset + i] !== sig[i]) return false;
	}
	return true;
}

function sniffPdf(bytes: Uint8Array): boolean {
	return bytesIncludeAscii(bytes, "%PDF");
}

function sniffZip(bytes: Uint8Array): boolean {
	return bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
}

function sniffPng(bytes: Uint8Array): boolean {
	return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
}

function sniffJpeg(bytes: Uint8Array): boolean {
	return (
		bytes.length >= 3 &&
		bytes[0] === 0xff &&
		bytes[1] === 0xd8 &&
		bytes[2] === 0xff
	);
}

function sniffWebp(bytes: Uint8Array): boolean {
	return (
		bytesIncludeAscii(bytes, "RIFF", 0) &&
		bytes.length >= 12 &&
		bytesIncludeAscii(bytes, "WEBP", 8)
	);
}

function sniffHeic(bytes: Uint8Array): boolean {
	if (bytes.length < 12) return false;
	if (!bytesIncludeAscii(bytes, "ftyp", 4)) return false;
	const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
	return ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand);
}

async function sniffRasterImage(
	file: File,
	format: FormatId,
): Promise<boolean> {
	const head = await readHead(file);
	if (format === "png") return sniffPng(head);
	if (format === "jpeg") return sniffJpeg(head);
	if (format === "webp") return sniffWebp(head);
	if (format === "heic") return sniffHeic(head);

	if (typeof createImageBitmap !== "function") return true;
	try {
		const bitmap = await createImageBitmap(file);
		bitmap.close();
		return true;
	} catch {
		return false;
	}
}

async function sniffJson(file: File): Promise<boolean> {
	const text = (await file.text()).trim();
	if (!text) return false;
	try {
		JSON.parse(text);
		return true;
	} catch {
		return false;
	}
}

const INVALID_BY_FORMAT: Partial<Record<FormatId, string>> = {
	pdf: "doesn't look like a valid PDF",
	docx: "doesn't look like a valid Word document",
	xlsx: "doesn't look like a valid Excel workbook",
	json: "doesn't contain valid JSON",
	png: "doesn't look like a valid PNG image",
	jpeg: "doesn't look like a valid JPEG image",
	webp: "doesn't look like a valid WebP image",
	heic: "doesn't look like a valid HEIC image",
};

/**
 * Returns a short user-facing reason if content doesn't match declared format, else null.
 */
export async function sniffFileContent(
	file: File,
	format: FormatId,
): Promise<string | null> {
	const head = await readHead(file);

	switch (format) {
		case "pdf":
			if (!sniffPdf(head)) return INVALID_BY_FORMAT.pdf ?? "invalid file";
			return null;
		case "docx":
		case "xlsx":
			if (!sniffZip(head)) return INVALID_BY_FORMAT[format] ?? "invalid file";
			return null;
		case "json":
			if (!(await sniffJson(file)))
				return INVALID_BY_FORMAT.json ?? "invalid file";
			return null;
		case "png":
		case "jpeg":
		case "webp":
		case "heic":
			if (!(await sniffRasterImage(file, format))) {
				return INVALID_BY_FORMAT[format] ?? "invalid image";
			}
			return null;
		case "csv":
		case "txt":
		case "html":
			return null;
		default:
			return null;
	}
}
