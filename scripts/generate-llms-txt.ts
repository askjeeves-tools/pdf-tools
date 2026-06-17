import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLlmsFullTxt, buildLlmsTxt } from "../src/llms.ts";
import { SEO_SITE_ORIGIN } from "../src/seo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const siteOrigin = SEO_SITE_ORIGIN;

writeFileSync(join(publicDir, "llms.txt"), buildLlmsTxt(siteOrigin), "utf8");
writeFileSync(
	join(publicDir, "llms-full.txt"),
	buildLlmsFullTxt(siteOrigin),
	"utf8",
);

console.log("Generated public/llms.txt and public/llms-full.txt");
