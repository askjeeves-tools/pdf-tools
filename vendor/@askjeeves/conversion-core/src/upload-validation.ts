import { detectFormat } from "./catalog";
import { type FileBatchResult, validateFileBatch } from "./file-batch";
import { DEFAULT_MAX_FILE_BYTES, getMaxFileBytesForFormat } from "./limits";
import { sniffFileContent } from "./sniff";
import type { FormatId } from "./types";
import { formatBytes } from "./utils";

export function fileUploadLimit(file: File, globalMaxBytes: number): number {
	const format = detectFormat(file);
	const formatCap = format
		? getMaxFileBytesForFormat(format)
		: DEFAULT_MAX_FILE_BYTES;
	return Math.min(globalMaxBytes, formatCap);
}

/**
 * Extension/MIME batch rules, per-format size caps, and content sniffing at upload.
 */
export async function validateUploadFiles(
	files: File[],
	options: { maxBytes: number; expectedFormat?: FormatId },
): Promise<FileBatchResult> {
	const batch = validateFileBatch(files);
	if (!batch.ok) return batch;

	if (options.expectedFormat && batch.format !== options.expectedFormat) {
		return {
			ok: false,
			error: `This tool only accepts ${options.expectedFormat.toUpperCase()} files.`,
		};
	}

	for (const file of batch.files) {
		const limit = fileUploadLimit(file, options.maxBytes);
		if (file.size > limit) {
			return {
				ok: false,
				error: `${file.name} is too large (${formatBytes(file.size)}). Max ${formatBytes(limit)}.`,
			};
		}
	}

	for (const file of batch.files) {
		const reason = await sniffFileContent(file, batch.format);
		if (reason) {
			return {
				ok: false,
				error: `${file.name}: This file ${reason}.`,
			};
		}
	}

	return batch;
}
