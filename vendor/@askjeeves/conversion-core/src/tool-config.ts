import { getAcceptForFormat } from "./catalog";
import type { ToolConfig } from "./types";

export function createToolConfig(
	partial: Omit<ToolConfig, "accept"> & { accept?: string },
): ToolConfig {
	return {
		...partial,
		accept: partial.accept ?? getAcceptForFormat(partial.sourceFormat),
		minFiles: partial.minFiles ?? 1,
	};
}

export { formatLabel, getAcceptForFormat } from "./catalog";

export type { FormatId, ToolConfig } from "./types";
