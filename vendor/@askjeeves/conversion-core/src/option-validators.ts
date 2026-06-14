import { userFacingError } from "./errors";
import { MAX_DOCX_PDF_BYTES, MAX_PDF_PAGES } from "./limits";
import type { ConversionDefinition, ConversionOptions } from "./types";
import { formatBytes } from "./utils";

export type OptionValidationResult =
	| { ok: true; options: ConversionOptions }
	| { ok: false; error: string };

function isMultiFileConversion(conversionId: string): boolean {
	return (
		conversionId === "pdf-merge" || conversionId.endsWith("-compress-batch")
	);
}

function isCropConversion(conversionId: string): boolean {
	return conversionId.endsWith("-crop");
}

export function validateOptionsBeforeConvert(
	conversion: ConversionDefinition,
	files: File[],
	rawOptions: ConversionOptions,
): OptionValidationResult {
	if (isMultiFileConversion(conversion.id) && files.length < 2) {
		return {
			ok: false,
			error: "This conversion requires at least 2 files.",
		};
	}

	if (conversion.id === "docx-pdf") {
		const file = files[0];
		if (file && file.size > MAX_DOCX_PDF_BYTES) {
			return {
				ok: false,
				error: `File exceeds ${formatBytes(MAX_DOCX_PDF_BYTES)} limit for Word → PDF.`,
			};
		}
	}

	if (conversion.options === "pdf") {
		const opts = rawOptions as { pageFrom?: number; pageTo?: number };
		const pageFrom = opts.pageFrom ?? 1;
		if (pageFrom < 1) {
			return { ok: false, error: "Page from must be at least 1." };
		}
		if (opts.pageTo != null && opts.pageTo < pageFrom) {
			return {
				ok: false,
				error: "Page range invalid: start must be ≤ end.",
			};
		}
		if (opts.pageTo != null && opts.pageTo > MAX_PDF_PAGES) {
			return {
				ok: false,
				error: `Maximum ${MAX_PDF_PAGES} pages per job.`,
			};
		}
	}

	if (isCropConversion(conversion.id)) {
		const opts = rawOptions as {
			cropWidth?: number;
			cropHeight?: number;
		};
		if (
			opts.cropWidth != null &&
			opts.cropHeight != null &&
			(opts.cropWidth < 1 || opts.cropHeight < 1)
		) {
			return { ok: false, error: "Crop area must be at least 1×1 pixels." };
		}
	}

	return { ok: true, options: rawOptions };
}

export function assertNonEmptyBlob(blob: Blob): void {
	if (blob.size === 0) {
		throw userFacingError(
			"Conversion produced an empty file. Try different options.",
		);
	}
}
