import { existsSync } from "node:fs";

/** @param {string[]} paths */
export function allExist(paths) {
	return paths.every((p) => existsSync(p));
}

/**
 * @param {{ sources: string[]; outputs: string[]; label: string; sourceHint: string; placeholderCmd: string }} opts
 */
export function shouldSkipAssetPrep(opts) {
	const { sources, outputs, label, sourceHint, placeholderCmd } = opts;
	if (allExist(sources)) return false;
	if (allExist(outputs)) {
		console.warn(
			`[skip] ${label}: sources missing; committed outputs present. To regenerate, add sources to ${sourceHint}`,
		);
		process.exit(0);
	}
	console.error(`[fail] ${label}: missing sources AND outputs.`);
	console.error(`  Run: ${placeholderCmd}`);
	console.error(`  Or add sources: ${sourceHint}`);
	process.exit(1);
}
