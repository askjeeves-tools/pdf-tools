import type {
	ConversionOptions,
	ConversionResult,
	ProcessorContext,
} from "@askjeeves/conversion-core";
import {
	basename,
	canvasToBlob,
	MAX_PDF_PAGES,
	readFileBytes,
	throwIfAborted,
	userFacingError,
	withConversionError,
} from "@askjeeves/conversion-core";

export function parsePageRange(
	pageFrom: unknown,
	pageTo: unknown,
	total: number,
): number[] {
	const from = Math.max(1, Math.floor(Number(pageFrom) || 1));
	const to = Math.min(total, Math.floor(Number(pageTo) || total));
	if (from > to) {
		throw userFacingError("Page range invalid: start must be ≤ end.");
	}
	const indices: number[] = [];
	for (let p = from; p <= to; p++) {
		indices.push(p - 1);
	}
	if (indices.length > MAX_PDF_PAGES) {
		throw userFacingError(
			`Too many pages (${indices.length}). Maximum is ${MAX_PDF_PAGES} per job.`,
		);
	}
	return indices;
}

export function parsePagesToKeep(
	pageFrom: unknown,
	pageTo: unknown,
	total: number,
): number[] {
	const remove = new Set(parsePageRange(pageFrom, pageTo, total));
	const keep: number[] = [];
	for (let i = 0; i < total; i++) {
		if (!remove.has(i)) keep.push(i);
	}
	if (keep.length === 0) {
		throw userFacingError("Cannot remove all pages from a PDF.");
	}
	return keep;
}

async function loadPdfJs() {
	try {
		const pdfjs = await import("pdfjs-dist");
		if (!pdfjs.GlobalWorkerOptions.workerSrc) {
			pdfjs.GlobalWorkerOptions.workerSrc = new URL(
				"pdfjs-dist/build/pdf.worker.min.mjs",
				import.meta.url,
			).toString();
		}
		return pdfjs;
	} catch (_err) {
		throw userFacingError(
			"PDF engine failed to load. Refresh the page and try again.",
		);
	}
}

export async function pdfExtract(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		throwIfAborted(context?.signal);
		const { PDFDocument } = await import("pdf-lib");
		const bytes = await readFileBytes(file);
		throwIfAborted(context?.signal);
		const src = await PDFDocument.load(bytes);
		const total = src.getPageCount();
		const indices = parsePageRange(options?.pageFrom, options?.pageTo, total);

		const out = await PDFDocument.create();
		const pages = await out.copyPages(src, indices);
		for (const page of pages) {
			out.addPage(page);
		}

		const pdfBytes = await out.save();
		return {
			blob: new Blob([pdfBytes], { type: "application/pdf" }),
			filename: `${basename(file.name)}-extract.pdf`,
			mimeType: "application/pdf",
		};
	});
}

export async function pdfRemovePages(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		throwIfAborted(context?.signal);
		const { PDFDocument } = await import("pdf-lib");
		const bytes = await readFileBytes(file);
		throwIfAborted(context?.signal);
		const src = await PDFDocument.load(bytes);
		const total = src.getPageCount();
		const indices = parsePagesToKeep(options?.pageFrom, options?.pageTo, total);

		const out = await PDFDocument.create();
		const pages = await out.copyPages(src, indices);
		for (const page of pages) {
			out.addPage(page);
		}

		const pdfBytes = await out.save();
		return {
			blob: new Blob([pdfBytes], { type: "application/pdf" }),
			filename: `${basename(file.name)}-trimmed.pdf`,
			mimeType: "application/pdf",
		};
	});
}

export async function pdfSplitZip(
	file: File,
	_options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		const { PDFDocument } = await import("pdf-lib");
		const JSZip = (await import("jszip")).default;
		const bytes = await readFileBytes(file);
		const src = await PDFDocument.load(bytes);
		const total = src.getPageCount();

		if (total > MAX_PDF_PAGES) {
			throw userFacingError(
				`PDF has ${total} pages. Maximum is ${MAX_PDF_PAGES} for split.`,
			);
		}

		const zip = new JSZip();
		for (let i = 0; i < total; i++) {
			throwIfAborted(context?.signal);
			const single = await PDFDocument.create();
			const [page] = await single.copyPages(src, [i]);
			single.addPage(page);
			const pageBytes = await single.save();
			zip.file(`page-${i + 1}.pdf`, pageBytes);
		}

		const zipBlob = await zip.generateAsync({ type: "blob" });
		return {
			blob: zipBlob,
			filename: `${basename(file.name)}-pages.zip`,
			mimeType: "application/zip",
		};
	});
}

type ImageOutputFormat = "png" | "jpeg" | "webp";

async function renderPageToImage(
	pdfjs: Awaited<ReturnType<typeof loadPdfJs>>,
	pdfData: Uint8Array,
	pageNumber: number,
	scale: number,
	format: ImageOutputFormat,
	quality: number,
): Promise<Blob> {
	const doc = await pdfjs.getDocument({ data: pdfData.slice() }).promise;
	const page = await doc.getPage(pageNumber);
	const viewport = page.getViewport({ scale });
	const canvas = document.createElement("canvas");
	canvas.width = viewport.width;
	canvas.height = viewport.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw userFacingError("Canvas not supported.");
	await page.render({ canvasContext: ctx, viewport }).promise;

	const mime =
		format === "png"
			? "image/png"
			: format === "webp"
				? "image/webp"
				: "image/jpeg";

	return canvasToBlob(canvas, mime, format === "png" ? undefined : quality);
}

async function pdfPagesToImages(
	file: File,
	options: ConversionOptions | undefined,
	format: ImageOutputFormat,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		const pdfjs = await loadPdfJs();
		const bytes = await readFileBytes(file);
		const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
		const total = doc.numPages;
		const indices = parsePageRange(options?.pageFrom, options?.pageTo, total);
		const scale = Math.min(3, Math.max(0.5, Number(options?.scale) || 1.5));
		const quality = format === "png" ? 1 : 0.85;
		const ext = format === "jpeg" ? "jpg" : format;
		const mime =
			format === "png"
				? "image/png"
				: format === "webp"
					? "image/webp"
					: "image/jpeg";

		if (indices.length === 1) {
			const blob = await renderPageToImage(
				pdfjs,
				bytes,
				indices[0] + 1,
				scale,
				format,
				quality,
			);
			return {
				blob,
				filename: `${basename(file.name)}-page-${indices[0] + 1}.${ext}`,
				mimeType: mime,
			};
		}

		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();
		for (const idx of indices) {
			throwIfAborted(context?.signal);
			const blob = await renderPageToImage(
				pdfjs,
				bytes,
				idx + 1,
				scale,
				format,
				quality,
			);
			zip.file(`page-${idx + 1}.${ext}`, blob);
		}

		const zipBlob = await zip.generateAsync({ type: "blob" });
		return {
			blob: zipBlob,
			filename: `${basename(file.name)}-pages.zip`,
			mimeType: "application/zip",
		};
	});
}

export async function pdfToPng(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return pdfPagesToImages(file, options, "png", context);
}

export async function pdfToJpeg(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return pdfPagesToImages(file, options, "jpeg", context);
}

export async function pdfToWebp(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return pdfPagesToImages(file, options, "webp", context);
}

export async function pdfCompress(
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
): Promise<ConversionResult> {
	return withConversionError("pdf", async () => {
		const mode = options?.pdfCompressMode ?? "light";

		if (mode === "light") {
			const { PDFDocument } = await import("pdf-lib");
			const bytes = await readFileBytes(file);
			const src = await PDFDocument.load(bytes);
			const pdfBytes = await src.save({ useObjectStreams: true });
			return {
				blob: new Blob([pdfBytes], { type: "application/pdf" }),
				filename: `${basename(file.name)}-optimized.pdf`,
				mimeType: "application/pdf",
			};
		}

		const pdfjs = await loadPdfJs();
		const { PDFDocument } = await import("pdf-lib");
		const bytes = await readFileBytes(file);
		const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
		const total = doc.numPages;

		if (total > MAX_PDF_PAGES) {
			throw userFacingError(
				`PDF has ${total} pages. Maximum is ${MAX_PDF_PAGES} for rasterize compress.`,
			);
		}

		const out = await PDFDocument.create();
		const scale = 1.2;
		const quality = 0.72;

		for (let i = 1; i <= total; i++) {
			throwIfAborted(context?.signal);
			const jpegBlob = await renderPageToImage(
				pdfjs,
				bytes,
				i,
				scale,
				"jpeg",
				quality,
			);
			const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
			const image = await out.embedJpg(jpegBytes);
			const page = out.addPage([image.width, image.height]);
			page.drawImage(image, {
				x: 0,
				y: 0,
				width: image.width,
				height: image.height,
			});
		}

		const pdfBytes = await out.save({ useObjectStreams: true });
		return {
			blob: new Blob([pdfBytes], { type: "application/pdf" }),
			filename: `${basename(file.name)}-compressed.pdf`,
			mimeType: "application/pdf",
		};
	});
}
