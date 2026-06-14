import { detectFormat, formatLabel } from "./catalog";
import type { FormatId } from "./types";

export type FileBatchResult =
	| { ok: true; format: FormatId; files: File[] }
	| { ok: false; error: string };

export function validateFileBatch(files: File[]): FileBatchResult {
	if (files.length === 0) {
		return { ok: false, error: "No files selected." };
	}

	const unsupported: string[] = [];
	const formats: FormatId[] = [];

	for (const file of files) {
		const format = detectFormat(file);
		if (!format) {
			unsupported.push(file.name);
			continue;
		}
		formats.push(format);
	}

	if (unsupported.length > 0) {
		return {
			ok: false,
			error: `Unsupported file type: ${unsupported.join(", ")}.`,
		};
	}

	const first = formats[0];
	const mixed = formats.some((f) => f !== first);
	if (mixed) {
		return {
			ok: false,
			error: "Use one file type per batch (e.g. all PDF or all JPEG).",
		};
	}

	return { ok: true, format: first, files };
}

export function formatBatchLabel(format: FormatId, count: number): string {
	const label = formatLabel(format);
	return count === 1 ? label : `${count} × ${label}`;
}

export function assertToolFormat(
	batchFormat: FormatId,
	expectedFormat: FormatId,
): FileBatchResult {
	if (batchFormat !== expectedFormat) {
		return {
			ok: false,
			error: `This tool only accepts ${formatLabel(expectedFormat)} files.`,
		};
	}
	return { ok: true, format: batchFormat, files: [] };
}
