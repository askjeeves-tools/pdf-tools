/**
 * Syncs processed mascot assets from askjeeves into @askjeeves/ui.
 * Run after: pnpm -C askjeeves prepare:mascot
 */
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const uiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = join(uiRoot, "../..");
const assetsDir = join(uiRoot, "assets");

const askjeevesMascotPng = join(
	monorepoRoot,
	"askjeeves/public/images/ask-jeeves-mascot.png",
);
const askjeevesMascotMeta = join(
	monorepoRoot,
	"askjeeves/src/generated/mascot-meta.json",
);
const askjeevesFaviconSource = join(
	monorepoRoot,
	"askjeeves/public/images/source/ask-jeeves-favicon-source.png",
);

const mascotOutput = join(assetsDir, "ask-jeeves-mascot.png");
const metaOutput = join(assetsDir, "mascot-meta.json");
const faviconOutput = join(assetsDir, "favicon-32x32.png");

if (!existsSync(askjeevesMascotPng)) {
	console.error("[fail] Missing askjeeves mascot output:", askjeevesMascotPng);
	console.error("  Run from monorepo root: pnpm prepare:mascot");
	console.error(
		"  Ensure source exists: askjeeves/public/images/ask-jeeves-mascot-source.png",
	);
	process.exit(1);
}

mkdirSync(assetsDir, { recursive: true });
copyFileSync(askjeevesMascotPng, mascotOutput);

if (existsSync(askjeevesMascotMeta)) {
	const meta = JSON.parse(readFileSync(askjeevesMascotMeta, "utf8"));
	writeFileSync(
		metaOutput,
		`${JSON.stringify({ width: meta.width, height: meta.height }, null, 2)}\n`,
	);
} else {
	const imageMeta = await sharp(mascotOutput).metadata();
	writeFileSync(
		metaOutput,
		`${JSON.stringify(
			{ width: imageMeta.width ?? 825, height: imageMeta.height ?? 845 },
			null,
			2,
		)}\n`,
	);
}

if (existsSync(askjeevesFaviconSource)) {
	await sharp(askjeevesFaviconSource)
		.resize(32, 32, { fit: "cover", position: "centre" })
		.png({ compressionLevel: 9 })
		.toFile(faviconOutput);
} else {
	await sharp(mascotOutput)
		.resize(32, 32, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png({ compressionLevel: 9 })
		.toFile(faviconOutput);
}

console.log(`Synced mascot → ${mascotOutput}`);
console.log(`Synced meta   → ${metaOutput}`);
console.log(`Synced favicon → ${faviconOutput}`);
