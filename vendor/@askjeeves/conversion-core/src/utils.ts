export function basename(name: string): string {
	return name.replace(/\.[^.]+$/, "");
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Image encoding failed."));
			},
			type,
			quality,
		);
	});
}

export function parseCsvWithHeaders(text: string): Record<string, string>[] {
	// PapaParse is used in processors-csv-json; core uses a minimal parser for tests
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length === 0) return [];

	const parseRow = (line: string): string[] => {
		const cells: string[] = [];
		let current = "";
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (ch === "," && !inQuotes) {
				cells.push(current);
				current = "";
			} else {
				current += ch;
			}
		}
		cells.push(current);
		return cells;
	};

	const headers = parseRow(lines[0] ?? "");
	return lines.slice(1).map((line) => {
		const values = parseRow(line);
		const record: Record<string, string> = {};
		for (let i = 0; i < headers.length; i++) {
			record[headers[i] ?? `__EMPTY_${i}`] = values[i] ?? "";
		}
		return record;
	});
}

/** Independent copy of file bytes safe to pass to workers / reuse after preview. */
export async function readFileBytes(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}

/** Clone bytes before pdf.js getDocument (worker may detach the underlying buffer). */
export function cloneBytes(bytes: Uint8Array): Uint8Array {
	return bytes.slice();
}

/** Throw when the user cancels a long-running conversion. */
export function throwIfAborted(signal?: AbortSignal): void {
	if (signal?.aborted) {
		throw (
			signal.reason ??
			new DOMException("The operation was aborted.", "AbortError")
		);
	}
}

export function setStatus(
	el: HTMLElement,
	text: string,
	isError = false,
): void {
	el.textContent = text;
	el.classList.toggle("error", isError);
	el.setAttribute("aria-live", isError ? "assertive" : "polite");
	if (isError) {
		el.setAttribute("role", "alert");
	} else {
		el.removeAttribute("role");
	}
}
