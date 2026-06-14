import type { FormatId } from "./types";

/** Default 50 MB — override via ask-jeeves:globals maxFileBytes in UI */
export const DEFAULT_MAX_FILE_BYTES = 52_428_800;

/** Max pages processed for PDF split / PNG export in one job */
export const MAX_PDF_PAGES = 50;

/** HEIC decode + canvas peaks above raw file size */
export const MAX_HEIC_FILE_BYTES = 26_214_400; // 25 MB

/** Word → PDF (basic) — DOM rasterization is memory-heavy */
export const MAX_DOCX_PDF_BYTES = 10_485_760; // 10 MB

/** Max rendered pages for Word → PDF (basic) */
export const MAX_DOCX_PDF_PAGES = 50;

export function getMaxFileBytesForFormat(format: FormatId): number {
	if (format === "heic") return MAX_HEIC_FILE_BYTES;
	return DEFAULT_MAX_FILE_BYTES;
}
