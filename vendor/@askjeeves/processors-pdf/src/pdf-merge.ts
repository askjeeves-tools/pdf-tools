import type {
	ConversionOptions,
	ConversionResult,
	ProcessorContext,
} from "@askjeeves/conversion-core";
import {
	basename,
	readFileBytes,
	throwIfAborted,
	UserFacingError,
	userFacingError,
	withConversionError,
} from "@askjeeves/conversion-core";

export async function pdfMerge(
	files: File[],
	_options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		if (files.length < 2) {
			throw userFacingError("Merge requires at least two PDF files.");
		}

		const { PDFDocument } = await import("pdf-lib");
		const out = await PDFDocument.create();

		for (const file of files) {
			throwIfAborted(context?.signal);
			try {
				const bytes = await readFileBytes(file);
				const src = await PDFDocument.load(bytes);
				const indices = src.getPageIndices();
				const pages = await out.copyPages(src, indices);
				for (const page of pages) {
					out.addPage(page);
				}
			} catch (err) {
				if (err instanceof UserFacingError) throw err;
				if (err instanceof DOMException && err.name === "AbortError") throw err;
				throw userFacingError(
					`Could not process ${file.name}. It may not be a valid PDF.`,
				);
			}
		}

		const pdfBytes = await out.save();
		const base = basename(files[0].name);

		return {
			blob: new Blob([pdfBytes], { type: "application/pdf" }),
			filename: `${base}-merged.pdf`,
			mimeType: "application/pdf",
		};
	});
}
