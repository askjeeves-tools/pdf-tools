import type { FormatId } from "./types";

const EXTENSION_MAP: Record<string, FormatId> = {
	png: "png",
	jpg: "jpeg",
	jpeg: "jpeg",
	webp: "webp",
	heic: "heic",
	heif: "heic",
	csv: "csv",
	json: "json",
	txt: "txt",
	docx: "docx",
	pdf: "pdf",
	xlsx: "xlsx",
	xls: "xlsx",
};

const FORMAT_LABELS: Record<FormatId, string> = {
	png: "PNG",
	jpeg: "JPEG",
	webp: "WebP",
	heic: "HEIC",
	csv: "CSV",
	json: "JSON",
	txt: "Plain text",
	docx: "Word (DOCX)",
	html: "HTML",
	pdf: "PDF",
	xlsx: "Excel (XLSX/XLS)",
};

const ACCEPT_BY_FORMAT: Record<FormatId, string> = {
	png: ".png",
	jpeg: ".jpg,.jpeg",
	webp: ".webp",
	heic: ".heic,.heif",
	csv: ".csv",
	json: ".json",
	txt: ".txt",
	docx: ".docx",
	html: ".html",
	pdf: ".pdf",
	xlsx: ".xlsx,.xls",
};

/** File input accept attribute derived from supported extensions */
export const SUPPORTED_ACCEPT_ATTR = [
	...new Set(Object.keys(EXTENSION_MAP).map((ext) => `.${ext}`)),
].join(",");

export function getInputFormatIds(): FormatId[] {
	return [...new Set(Object.values(EXTENSION_MAP))];
}

export function getAcceptForFormat(format: FormatId): string {
	return ACCEPT_BY_FORMAT[format];
}

export function detectFormat(file: File): FormatId | null {
	const ext = file.name.split(".").pop()?.toLowerCase();
	if (ext && ext in EXTENSION_MAP) {
		return EXTENSION_MAP[ext];
	}

	const mime = file.type.toLowerCase();
	if (mime === "image/png") return "png";
	if (mime === "image/jpeg") return "jpeg";
	if (mime === "image/webp") return "webp";
	if (mime === "image/heic" || mime === "image/heif") return "heic";
	if (mime === "text/csv") return "csv";
	if (mime === "application/json") return "json";
	if (mime === "text/plain") return "txt";
	if (mime === "application/pdf") return "pdf";
	if (
		mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return "xlsx";
	}
	if (mime === "application/vnd.ms-excel") return "xlsx";
	if (
		mime ===
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return "docx";
	}

	return null;
}

export function formatLabel(id: FormatId): string {
	return FORMAT_LABELS[id];
}
