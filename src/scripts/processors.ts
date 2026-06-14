import {
	pdfCompress,
	pdfExtract,
	pdfMerge,
	pdfRemovePages,
	pdfSplitZip,
	pdfToJpeg,
	pdfToPng,
	pdfToWebp,
} from "@askjeeves/processors-pdf";
import type { ProcessorMap } from "@askjeeves/ui/scripts/tool-controller";

export const processors: ProcessorMap = {
	"pdf-extract": pdfExtract,
	"pdf-split-zip": pdfSplitZip,
	"pdf-png": pdfToPng,
	"pdf-to-jpeg": pdfToJpeg,
	"pdf-to-webp": pdfToWebp,
	"pdf-remove-pages": pdfRemovePages,
	"pdf-compress": pdfCompress,
	"pdf-merge": pdfMerge,
};
