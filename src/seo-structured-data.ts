import { FAQ_ENTRIES } from "./faq";
import {
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

export function buildPdfToolsExtraGraph(
	siteOrigin: string,
	featureList: string[] = [],
) {
	const canonicalHref = new URL("/", siteOrigin).href;
	const organizationId = `${siteOrigin}/#organization`;
	const websiteId = `${siteOrigin}/#website`;
	const appId = `${siteOrigin}/#app`;
	const faqId = `${siteOrigin}/#faq`;
	const howToId = `${siteOrigin}/#howto`;

	const webApplication: Record<string, unknown> = {
		"@id": appId,
		"@type": "WebApplication",
		name: SEO_BRAND_TITLE,
		description: SEO_DESCRIPTION,
		url: canonicalHref,
		applicationCategory: "UtilityApplication",
		applicationSubCategory: "PDFConverter",
		operatingSystem: "Any",
		browserRequirements: "Requires JavaScript. Requires HTML5.",
		isAccessibleForFree: true,
		isPartOf: { "@id": websiteId },
		keywords: SEO_KEYWORDS.join(", "),
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
	};

	if (featureList.length > 0) {
		webApplication.featureList = featureList;
	}

	return [
		{
			"@id": organizationId,
			"@type": "Organization",
			name: "Ask Jeeves",
			url: ORGANIZATION_URL,
		},
		{
			"@id": websiteId,
			"@type": "WebSite",
			name: SEO_OG_TITLE,
			url: canonicalHref,
			description: SEO_DESCRIPTION,
			inLanguage: "en",
			publisher: { "@id": organizationId },
		},
		webApplication,
		{
			"@id": faqId,
			"@type": "FAQPage",
			isPartOf: { "@id": websiteId },
			mainEntity: FAQ_ENTRIES.map((entry) => ({
				"@type": "Question",
				name: entry.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: entry.answer,
				},
			})),
		},
		{
			"@id": howToId,
			"@type": "HowTo",
			name: "How to convert and edit PDF files",
			description: SECURITY_SECTION_COPY,
			isPartOf: { "@id": websiteId },
			step: HOW_IT_WORKS_STEPS.map((step, index) => ({
				"@type": "HowToStep",
				position: index + 1,
				name: `Step ${index + 1}`,
				text: step,
			})),
		},
	];
}
