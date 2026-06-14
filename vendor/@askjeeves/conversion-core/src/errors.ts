export type ConversionErrorKind =
	| "pdf"
	| "docx"
	| "xlsx"
	| "json"
	| "image"
	| "heic"
	| "csv"
	| "generic";

const MESSAGES: Record<ConversionErrorKind, string> = {
	pdf: "This file doesn't look like a valid PDF, or it may be encrypted or damaged.",
	docx: "This file doesn't look like a valid Word document, or it may be damaged.",
	xlsx: "This file doesn't look like a valid Excel workbook, or it may be damaged.",
	json: "This file doesn't contain valid JSON.",
	image:
		"This image could not be read. It may be corrupted or in an unsupported encoding.",
	heic: "This HEIC file could not be decoded. Try Safari on Apple devices or a different file.",
	csv: "This CSV file could not be read.",
	generic: "Conversion failed. Try a different file or format.",
};

/** Error with a message safe to show directly in the UI. */
export class UserFacingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserFacingError";
	}
}

export function userFacingError(message: string): UserFacingError {
	return new UserFacingError(message);
}

function devLog(kind: ConversionErrorKind, cause: unknown): void {
	if (!import.meta.env?.DEV) return;
	console.warn(`[conversion:${kind}]`, cause);
}

export function getErrorMessage(
	err: unknown,
	fallback = "Conversion failed.",
): string {
	if (err instanceof Error && err.message) return err.message;
	if (typeof err === "string" && err.trim()) return err.trim();
	if (err && typeof err === "object" && "message" in err) {
		const msg = (err as { message: unknown }).message;
		if (typeof msg === "string" && msg.trim()) return msg.trim();
	}
	return fallback;
}

export function conversionError(
	kind: ConversionErrorKind,
	cause: unknown,
): Error {
	devLog(kind, cause);
	const message = MESSAGES[kind];
	if (cause instanceof Error && import.meta.env?.DEV) {
		return new Error(`${message} (${cause.message})`);
	}
	return new Error(message);
}

/** Re-throw user-facing errors; wrap library failures with generic copy. */
export function conversionErrorUnlessUserError(
	kind: ConversionErrorKind,
	cause: unknown,
): Error {
	if (cause instanceof UserFacingError) {
		return cause;
	}
	return conversionError(kind, cause);
}

export async function withConversionError<T>(
	kind: ConversionErrorKind,
	fn: () => Promise<T>,
): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		throw conversionErrorUnlessUserError(kind, err);
	}
}

/** Map IndexedDB / storage failures to actionable user messages. */
export function mapIdbError(err: unknown): UserFacingError {
	if (err instanceof DOMException) {
		if (err.name === "QuotaExceededError") {
			return userFacingError(
				"Storage is full. Close other tabs using this site and try again.",
			);
		}
		if (err.name === "SecurityError") {
			return userFacingError(
				"File storage is blocked in this browser. Try disabling private browsing or allow site data.",
			);
		}
	}
	return userFacingError("Could not access file storage. Try uploading again.");
}
