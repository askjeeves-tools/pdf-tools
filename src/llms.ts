import { FAQ_ENTRIES } from "./faq";
import { getEnabledConversions } from "./seo-content";
import {
	CONVERSION_DESCRIPTIONS,
	HOW_IT_WORKS_STEPS,
	SECURITY_SECTION_COPY,
} from "./seo-copy";
import {
	SEO_BRAND_TITLE,
	SEO_DESCRIPTION,
	SEO_KEYWORDS,
	SEO_OG_TITLE,
} from "./seo";

const ORGANIZATION_URL = "https://askjeeves.cc";

export function buildLlmsTxt(siteOrigin: string): string {
	const canonicalHref = new URL("/", siteOrigin).href;
	const lines = [
		`# ${SEO_BRAND_TITLE} — Ask Jeeves`,
		"",
		`> ${SEO_DESCRIPTION}`,
		"",
		"## Tool",
		"",
		`- [${SEO_BRAND_TITLE}](${canonicalHref}): Merge, split, compress PDFs; export pages to PNG, JPEG, or WebP; extract or remove pages`,
		"",
		"## Supported conversions",
		"",
		...getEnabledConversions().map((conversion) => `- ${conversion.label}`),
		"",
		"## FAQ",
		"",
		...FAQ_ENTRIES.map(
			(entry) => `- ${entry.question} ${entry.answer}`,
		),
		"",
		"## Extended context",
		"",
		`- [Full site context](${new URL("/llms-full.txt", siteOrigin).href}): how-it-works, security, and per-conversion details`,
		"",
		"## More tools",
		"",
		`- [Ask Jeeves](${ORGANIZATION_URL}): Free file conversion tools (PDF, images, CSV/JSON/Excel, Word)`,
		"",
	];

	return `${lines.join("\n").trimEnd()}\n`;
}

export function buildLlmsFullTxt(siteOrigin: string): string {
	const canonicalHref = new URL("/", siteOrigin).href;
	const sitemapHref = new URL("/sitemap-index.xml", siteOrigin).href;
	const lines = [
		buildLlmsTxt(siteOrigin).trimEnd(),
		"",
		"## How it works",
		"",
		...HOW_IT_WORKS_STEPS.map((step, index) => `${index + 1}. ${step}`),
		"",
		"## Secure and private",
		"",
		SECURITY_SECTION_COPY,
		"",
		"## Conversion details",
		"",
		...getEnabledConversions().map((conversion) => {
			const description =
				CONVERSION_DESCRIPTIONS[conversion.id] ?? conversion.label;
			return `- **${conversion.label}** — ${description}`;
		}),
		"",
		"## Keywords",
		"",
		SEO_KEYWORDS.join(", "),
		"",
		"## Site metadata",
		"",
		`- Canonical URL: ${canonicalHref}`,
		`- Site name: ${SEO_OG_TITLE}`,
		`- Sitemap: ${sitemapHref}`,
		`- Organization: [Ask Jeeves](${ORGANIZATION_URL})`,
		"",
	];

	return `${lines.join("\n").trimEnd()}\n`;
}
