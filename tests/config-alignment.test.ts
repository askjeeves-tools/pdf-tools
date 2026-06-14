import { assertProcessorMapAligned } from "@askjeeves/test-e2e/alignment";
import { describe, it } from "vitest";
import { processors } from "../src/scripts/processors";
import { toolConfig } from "../tool.config";

describe("pdf-tools config alignment", () => {
	it("maps every enabled conversion id to a processor", () => {
		assertProcessorMapAligned(toolConfig, processors);
	});
});
