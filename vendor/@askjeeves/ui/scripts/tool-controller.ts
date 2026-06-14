import {
	assertNonEmptyBlob,
	type ConversionDefinition,
	type ConversionOptions,
	type ConversionOptionsKind,
	type ConversionProcessor,
	type ConversionResult,
	getErrorMessage,
	type ImageConversionOptions,
	type MultiFileConversionProcessor,
	type PdfConversionOptions,
	setStatus,
	type ToolConfig,
	validateOptionsBeforeConvert,
	validateUploadFiles,
	type XlsxConversionOptions,
} from "@askjeeves/conversion-core";

export type ProcessorEntry = ConversionProcessor | MultiFileConversionProcessor;

export type ProcessorMap = Record<string, ProcessorEntry>;

function isCropTool(id: string | undefined): boolean {
	return id != null && id.endsWith("-crop");
}

const CHUNK_LOAD_HINT =
	"Failed to load converter. Refresh the page and try again.";

function isChunkLoadFailure(err: unknown): boolean {
	if (!(err instanceof Error)) return false;
	const msg = err.message;
	return (
		msg.includes("Failed to fetch dynamically imported module") ||
		msg.includes("Importing a module script failed") ||
		msg.includes("Failed to fetch") ||
		msg.includes("ChunkLoadError") ||
		msg.includes("Loading chunk")
	);
}

function conversionFailureMessage(err: unknown): string {
	if (err instanceof DOMException && err.name === "AbortError") {
		return "Conversion cancelled.";
	}
	if (isChunkLoadFailure(err)) {
		return CHUNK_LOAD_HINT;
	}
	return getErrorMessage(err, "Conversion failed.");
}

export function initToolController(
	root: HTMLElement,
	config: ToolConfig,
	processors: ProcessorMap,
	maxBytes: number,
) {
	const statusEl = root.querySelector<HTMLElement>("#tool-status")!;
	const progressEl = root.querySelector<HTMLProgressElement>("#tool-progress")!;
	const progressLabel = root.querySelector<HTMLElement>(
		"#tool-progress-label",
	)!;
	const dropZone = root.querySelector<HTMLElement>("#tool-drop-zone")!;
	const fileInput = root.querySelector<HTMLInputElement>("#tool-file-input")!;
	const methodList = root.querySelector<HTMLElement>("#tool-method-list")!;
	const convertBtn =
		root.querySelector<HTMLButtonElement>("#tool-convert-btn")!;
	const cancelBtn = root.querySelector<HTMLButtonElement>("#tool-cancel-btn")!;
	const downloadLink = root.querySelector<HTMLAnchorElement>("#tool-download")!;
	const fileNameEl = root.querySelector<HTMLElement>("#tool-file-name")!;
	const convertPanel = root.querySelector<HTMLElement>("#tool-convert-panel");
	const imageOptions = root.querySelector<HTMLElement>("#image-options");
	const pdfOptions = root.querySelector<HTMLElement>("#pdf-options");
	const pdfCompressOptions = root.querySelector<HTMLElement>(
		"#pdf-compress-options",
	);
	const xlsxOptions = root.querySelector<HTMLElement>("#xlsx-options");
	const cropHint = root.querySelector<HTMLElement>("#crop-hint");
	const pdfRemoveHint = root.querySelector<HTMLElement>("#pdf-remove-hint");
	const pdfSplitHint = root.querySelector<HTMLElement>("#pdf-split-hint");
	const docxPdfHint = root.querySelector<HTMLElement>("#docx-pdf-hint");
	const qualityRange = root.querySelector<HTMLInputElement>("#quality-range");
	const maxWidthInput = root.querySelector<HTMLInputElement>("#max-width");
	const pageFromInput = root.querySelector<HTMLInputElement>("#page-from");
	const pageToInput = root.querySelector<HTMLInputElement>("#page-to");
	const sheetNameInput = root.querySelector<HTMLInputElement>("#sheet-name");

	if (!convertPanel && import.meta.env?.DEV) {
		console.warn(
			"[tool-controller] #tool-convert-panel not found; panel toggling disabled.",
		);
	}

	let files: File[] = [];
	let selectedConversion: ConversionDefinition | null = null;
	let downloadUrl: string | null = null;
	let isConverting = false;
	let abortController: AbortController | null = null;

	function showConvertPanel() {
		convertPanel?.classList.remove("hidden");
	}

	function hideConvertPanel() {
		convertPanel?.classList.add("hidden");
		methodList.innerHTML = "";
		selectedConversion = null;
	}

	function reportError(err: unknown, fallback: string) {
		hideProgress();
		setStatus(statusEl, getErrorMessage(err, fallback), true);
	}

	function hideProgress() {
		progressEl.classList.add("hidden");
		progressEl.removeAttribute("value");
		progressLabel.textContent = "";
		cancelBtn.classList.add("hidden");
	}

	function showProgress(indeterminate: boolean) {
		progressEl.classList.remove("hidden");
		cancelBtn.classList.remove("hidden");
		if (indeterminate) {
			progressEl.removeAttribute("value");
		}
	}

	function updateProgress(percent: number, label?: string) {
		progressEl.classList.remove("hidden");
		progressEl.value = Math.min(100, Math.max(0, percent));
		progressLabel.textContent = label ?? `Converting… ${percent}%`;
		cancelBtn.classList.remove("hidden");
	}

	function clearDownload() {
		if (downloadUrl) {
			URL.revokeObjectURL(downloadUrl);
			downloadUrl = null;
		}
		downloadLink.classList.add("hidden");
		downloadLink.removeAttribute("href");
	}

	function updateConvertButton() {
		convertBtn.disabled =
			isConverting || files.length === 0 || !selectedConversion;
	}

	function updateOptionPanels(
		kind: ConversionOptionsKind,
		conversionId: string,
	) {
		imageOptions?.classList.toggle("hidden", kind !== "image");
		pdfOptions?.classList.toggle("hidden", kind !== "pdf");
		pdfCompressOptions?.classList.toggle("hidden", kind !== "pdf-compress");
		xlsxOptions?.classList.toggle("hidden", kind !== "xlsx");
		pdfSplitHint?.classList.toggle("hidden", conversionId !== "pdf-split-zip");
		pdfRemoveHint?.classList.toggle(
			"hidden",
			conversionId !== "pdf-remove-pages",
		);
		docxPdfHint?.classList.toggle("hidden", conversionId !== "docx-pdf");
		cropHint?.classList.toggle(
			"hidden",
			!(kind === "image" && isCropTool(conversionId)),
		);
	}

	function collectOptions(kind: ConversionOptionsKind): ConversionOptions {
		if (kind === "image") {
			const opts: ImageConversionOptions = {
				quality: Number(qualityRange?.value ?? 0.92),
			};
			const mw = maxWidthInput?.value.trim();
			if (mw) opts.maxWidth = Number(mw);
			return opts;
		}
		if (kind === "pdf") {
			const opts: PdfConversionOptions = {
				pageFrom: Number(pageFromInput?.value) || 1,
			};
			const pageTo = pageToInput?.value.trim();
			if (pageTo) opts.pageTo = Number(pageTo);
			return opts;
		}
		if (kind === "pdf-compress") {
			const selected = root.querySelector<HTMLInputElement>(
				'input[name="pdf-compress-mode"]:checked',
			);
			return {
				pdfCompressMode:
					selected?.value === "rasterize" ? "rasterize" : "light",
			};
		}
		if (kind === "xlsx") {
			const opts: XlsxConversionOptions = {};
			const sheet = sheetNameInput?.value.trim();
			if (sheet) opts.sheetName = sheet;
			return opts;
		}
		return {};
	}

	function renderMethods() {
		methodList.innerHTML = "";
		selectedConversion = null;

		const enabled = config.conversions.filter((c) => c.enabled);

		if (enabled.length === 0) {
			hideConvertPanel();
			setStatus(statusEl, "No conversions available.", true);
			updateConvertButton();
			return;
		}

		for (const conversion of enabled) {
			const label = document.createElement("label");
			label.className = "method-option";

			const input = document.createElement("input");
			input.type = "radio";
			input.name = "conversion-method";
			input.value = conversion.id;

			const span = document.createElement("span");
			span.textContent = conversion.label;

			input.addEventListener("change", () => {
				if (input.checked) {
					selectedConversion = conversion;
					updateOptionPanels(conversion.options, conversion.id);
					setStatus(statusEl, `Selected: ${conversion.label}`);
					updateConvertButton();
				}
			});

			label.appendChild(input);
			label.appendChild(span);
			methodList.appendChild(label);
		}

		const firstInput = methodList.querySelector<HTMLInputElement>(
			'input[type="radio"]',
		);
		if (firstInput) {
			firstInput.checked = true;
			firstInput.dispatchEvent(new Event("change"));
		} else {
			updateConvertButton();
		}
	}

	async function handleFiles(fileList: File[]) {
		clearDownload();
		try {
			const batch = await validateUploadFiles(fileList, {
				maxBytes,
				expectedFormat: config.sourceFormat,
			});

			if (!batch.ok) {
				files = [];
				fileNameEl.textContent = "";
				hideConvertPanel();
				setStatus(statusEl, batch.error, true);
				updateConvertButton();
				return;
			}

			files = batch.files;
			fileNameEl.textContent = files.map((f) => f.name).join(", ");
			setStatus(statusEl, `${files.length} file(s) ready.`);
			showConvertPanel();
			renderMethods();
			updateConvertButton();
		} catch (err) {
			files = [];
			fileNameEl.textContent = "";
			hideConvertPanel();
			reportError(err, "Could not read that file. Try again.");
			updateConvertButton();
		} finally {
			fileInput.value = "";
		}
	}

	async function runConversionJob() {
		if (!selectedConversion || isConverting) return;

		const validation = validateOptionsBeforeConvert(
			selectedConversion,
			files,
			collectOptions(selectedConversion.options),
		);
		if (!validation.ok) {
			setStatus(statusEl, validation.error, true);
			return;
		}

		const entry = processors[selectedConversion.id];
		if (!entry) {
			setStatus(statusEl, "This conversion is not available.", true);
			return;
		}

		clearDownload();
		isConverting = true;
		abortController = new AbortController();
		updateConvertButton();
		setStatus(statusEl, "Converting…");
		showProgress(true);
		progressLabel.textContent = "Converting…";

		let result: ConversionResult;

		try {
			const processor = processors[selectedConversion.id];
			if (!processor) {
				setStatus(statusEl, "This conversion is not available.", true);
				return;
			}

			const context = {
				signal: abortController.signal,
				onProgress: (percent: number, label?: string) => {
					updateProgress(percent, label ?? `Converting… ${percent}%`);
				},
			};

			if (selectedConversion.allowsMultipleInputs) {
				result = await (processor as MultiFileConversionProcessor)(
					files,
					validation.options,
					context,
				);
			} else {
				const file = files[0];
				if (!file) {
					setStatus(statusEl, "No file provided.", true);
					return;
				}
				result = await (processor as ConversionProcessor)(
					file,
					validation.options,
					context,
				);
			}

			assertNonEmptyBlob(result.blob);
			downloadUrl = URL.createObjectURL(result.blob);
			downloadLink.href = downloadUrl;
			downloadLink.download = result.filename;
			downloadLink.textContent = `Download ${result.filename}`;
			downloadLink.classList.remove("hidden");
			updateProgress(100, "Done");
			setTimeout(hideProgress, 1000);
			setStatus(statusEl, "Done. Your file is ready to download.");
		} catch (err) {
			hideProgress();
			if (err instanceof DOMException && err.name === "AbortError") {
				setStatus(statusEl, "Conversion cancelled.");
			} else {
				setStatus(statusEl, conversionFailureMessage(err), true);
			}
		} finally {
			isConverting = false;
			abortController = null;
			updateConvertButton();
		}
	}

	dropZone.addEventListener("click", () => fileInput.click());

	fileInput.addEventListener("change", () => {
		const list = fileInput.files;
		if (!list?.length) return;
		void handleFiles([...list]);
	});

	dropZone.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			fileInput.click();
		}
	});

	dropZone.addEventListener("dragover", (e) => {
		e.preventDefault();
		dropZone.classList.add("drag-over");
	});
	dropZone.addEventListener("dragleave", () => {
		dropZone.classList.remove("drag-over");
	});
	dropZone.addEventListener("drop", (e) => {
		e.preventDefault();
		dropZone.classList.remove("drag-over");
		const list = e.dataTransfer?.files;
		if (!list?.length) return;
		void handleFiles([...list]);
	});

	convertBtn.addEventListener("click", () => {
		void runConversionJob();
	});

	cancelBtn.addEventListener("click", () => {
		abortController?.abort();
	});

	window.addEventListener("beforeunload", () => {
		clearDownload();
	});

	const onGlobalFailure = (reason: unknown) => {
		if (isConverting) {
			isConverting = false;
			abortController = null;
			updateConvertButton();
		}
		const message = isChunkLoadFailure(reason)
			? CHUNK_LOAD_HINT
			: getErrorMessage(reason, "Something went wrong. Try again.");
		reportError(reason, message);
	};

	window.addEventListener("unhandledrejection", (event) => {
		onGlobalFailure(event.reason);
	});

	window.addEventListener("error", (event) => {
		onGlobalFailure(event.error ?? event.message);
	});

	hideConvertPanel();
	updateConvertButton();
}
