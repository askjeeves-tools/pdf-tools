import { describe, expect, it } from "vitest";
import { processors } from "../src/scripts/processors";
import { toolConfig } from "../tool.config";

function assertProcessorMapAligned(
	config: typeof toolConfig,
	processorMap: typeof processors,
) {
	const missing = config.conversions
		.filter((c) => c.enabled)
		.filter((c) => !processorMap[c.id]);
	if (missing.length > 0) {
		throw new Error(
			`Missing processors: ${missing.map((c) => c.id).join(", ")}`,
		);
	}
}

describe("pdf-tools processor alignment", () => {
	it("maps every enabled conversion id to a processor", () => {
		assertProcessorMapAligned(toolConfig, processors);
		expect(
			toolConfig.conversions.filter((c) => c.enabled).every((c) => processors[c.id]),
		).toBe(true);
	});
});
