export const HOW_IT_WORKS_STEPS = [
	"Upload one or more PDF files using the drop zone or file picker.",
	"Choose an operation (merge, split, compress, export to images, extract or remove pages).",
	"Click Convert, then download your result. Nothing is uploaded to a server.",
] as const;

export const SECURITY_SECTION_COPY =
	"Your files are processed locally in your browser. Nothing is stored on a server and nothing is uploaded over the network. That makes this tool a good fit for contracts, financial documents, and other sensitive PDFs you do not want to send to a third-party service.";

export const CONVERSION_DESCRIPTIONS: Record<string, string> = {
	"pdf-extract":
		"Extract a page range from a PDF and download a new PDF with only those pages.",
	"pdf-split-zip":
		"Split every page into its own PDF file and download them as a ZIP archive.",
	"pdf-png":
		"Export PDF pages as PNG images. Multiple pages are packaged in a ZIP file.",
	"pdf-to-jpeg": "Convert PDF pages to JPEG images with quality control.",
	"pdf-to-webp": "Convert PDF pages to WebP images for smaller file sizes.",
	"pdf-remove-pages":
		"Remove selected pages from a PDF and download the updated document.",
	"pdf-compress": "Reduce PDF file size while keeping the document readable.",
	"pdf-merge": "Combine multiple PDF files into a single document in upload order.",
};
