export type FormatId =
	| "png"
	| "jpeg"
	| "webp"
	| "heic"
	| "csv"
	| "json"
	| "txt"
	| "html"
	| "docx"
	| "pdf"
	| "xlsx";

export type ConversionOptionsKind =
	| "image"
	| "pdf"
	| "pdf-compress"
	| "xlsx"
	| "none";

export type ToolAvailability = "available" | "unavailable";

export interface ConversionDefinition {
	id: string;
	source: FormatId;
	target: FormatId;
	label: string;
	enabled: boolean;
	options: ConversionOptionsKind;
	allowsMultipleInputs?: boolean;
	availability?: ToolAvailability;
}

export interface ConversionResult {
	blob: Blob;
	filename: string;
	mimeType: string;
}

export type ProgressCallback = (percent: number, label?: string) => void;

export interface ProcessorContext {
	onProgress?: ProgressCallback;
	signal?: AbortSignal;
}

export type ImageConversionOptions = {
	quality?: number;
	maxWidth?: number;
	cropX?: number;
	cropY?: number;
	cropWidth?: number;
	cropHeight?: number;
};

export type PdfConversionOptions = {
	pageFrom?: number;
	pageTo?: number;
	scale?: number;
	pdfCompressMode?: "light" | "rasterize";
};

export type XlsxConversionOptions = {
	sheetName?: string;
};

export type ConversionOptions =
	| ImageConversionOptions
	| PdfConversionOptions
	| XlsxConversionOptions
	| Record<string, never>;

export type ConversionProcessor = (
	file: File,
	options?: ConversionOptions,
	context?: ProcessorContext,
) => Promise<ConversionResult>;

export type MultiFileConversionProcessor = (
	files: File[],
	options?: ConversionOptions,
	context?: ProcessorContext,
) => Promise<ConversionResult>;

export interface ToolConfig {
	id: string;
	title: string;
	tagline: string;
	sourceFormat: FormatId;
	accept: string;
	conversions: ConversionDefinition[];
	allowsMultiple: boolean;
	minFiles: number;
}
