import {
	SEO_BRAND_TITLE,
	SEO_DESCRIPTION,
	SEO_DOCUMENT_TITLE,
	SEO_OG_IMAGE_ALT,
	SEO_OG_LOCALE,
	SEO_OG_TITLE,
	SEO_SITE_ORIGIN,
} from "../../src/seo";
import { FAQ_ENTRIES } from "../../src/faq";
import { HOW_IT_WORKS_STEPS, SECURITY_SECTION_COPY } from "../../src/seo-copy";

import { test, expect } from "@playwright/test";

const SITE_ORIGIN = SEO_SITE_ORIGIN;

test("homepage has SEO meta tags and structured data", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle(SEO_DOCUMENT_TITLE);

	const description = page.locator('meta[name="description"]');
	await expect(description).toHaveAttribute("content", SEO_DESCRIPTION);

	const canonical = page.locator('link[rel="canonical"]');
	await expect(canonical).toHaveAttribute("href", `${SITE_ORIGIN}/`);

	await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
		"content",
		SEO_OG_TITLE,
	);
	await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
		"content",
		SEO_DESCRIPTION,
	);
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		"content",
		`${SITE_ORIGIN}/og.png`,
	);
	await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
		"content",
		"1200",
	);
	await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
		"content",
		"630",
	);
	await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
		"content",
		SEO_OG_IMAGE_ALT,
	);
	await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
		"content",
		SEO_OG_LOCALE,
	);
	await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
		"content",
		"summary_large_image",
	);
	await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
		"content",
		SEO_DESCRIPTION,
	);

	await expect(
		page.locator('link[rel="alternate"][href="/llms.txt"]'),
	).toHaveCount(1);
	await expect(
		page.locator('link[rel="alternate"][href="/llms-full.txt"]'),
	).toHaveCount(1);

	const jsonLd = page.locator('script[type="application/ld+json"]');
	await expect(jsonLd).toHaveCount(1);
	const structuredData = JSON.parse(await jsonLd.innerText());
	const types = structuredData["@graph"].map(
		(entry: { "@type": string }) => entry["@type"],
	);
	expect(types).toContain("WebApplication");
	expect(types).toContain("Organization");
	expect(types).toContain("WebSite");
	expect(types).toContain("FAQPage");
	expect(types).toContain("HowTo");

	const faqPage = structuredData["@graph"].find(
		(entry: { "@type": string }) => entry["@type"] === "FAQPage",
	);
	expect(faqPage?.["@id"]).toBe(`${SITE_ORIGIN}/#faq`);

	const website = structuredData["@graph"].find(
		(entry: { "@type": string }) => entry["@type"] === "WebSite",
	);
	expect(website?.inLanguage).toBe("en");

	await expect(page.locator("h1")).toHaveText(SEO_BRAND_TITLE);
	const expander = page.locator("details.supported-conversions-expander");
	await expect(expander.locator("summary")).toHaveText("Supported PDF conversions");
	await expect(expander.locator("li")).toHaveCount(8);
	expect(await page.content()).toContain("Merge PDF");

	await expect(page.locator(".seo-faq-item")).toHaveCount(8);

	const seoExpanders = page.locator("details.seo-expander");
	await expect(seoExpanders).toHaveCount(5);
	for (const expander of await seoExpanders.all()) {
		await expect(expander).not.toHaveAttribute("open", "");
	}
	await expect(
		seoExpanders.filter({ has: page.locator("summary", { hasText: "How it works" }) }),
	).toBeVisible();
	await expect(
		seoExpanders.filter({
			has: page.locator("summary", { hasText: "Supported PDF conversions" }),
		}),
	).toBeVisible();
	await expect(
		seoExpanders.filter({ has: page.locator("summary", { hasText: "Secure and private" }) }),
	).toBeVisible();
	await expect(
		seoExpanders.filter({
			has: page.locator("summary", { hasText: "Frequently asked questions" }),
		}),
	).toBeVisible();
	await expect(
		seoExpanders.filter({
			has: page.locator("summary", {
				hasText: "What other AskJeeves tools are available",
			}),
		}),
	).toBeVisible();
	expect(await page.content()).toContain("https://askjeeves.cc");
	expect(await page.content()).toContain("Secure and private");
	expect(await page.content()).toContain("secure");
});

test("noscript notice is present in HTML", async ({ page }) => {
	await page.goto("/");
	const html = await page.content();
	expect(html).toContain("requires JavaScript");
	expect(html).toContain("<noscript>");
});

test("static SEO files are served", async ({ request }) => {
	const robots = await request.get("/robots.txt");
	expect(robots.ok()).toBeTruthy();
	const robotsText = await robots.text();
	expect(robotsText).toContain("Sitemap: https://pdf.askjeeves.cc/sitemap-index.xml");

	const llms = await request.get("/llms.txt");
	expect(llms.ok()).toBeTruthy();
	const llmsText = await llms.text();
	expect(llmsText).toContain(SEO_BRAND_TITLE);
	for (const entry of FAQ_ENTRIES) {
		expect(llmsText).toContain(entry.question);
	}
	expect(llmsText).toContain("/llms-full.txt");

	const llmsFull = await request.get("/llms-full.txt");
	expect(llmsFull.ok()).toBeTruthy();
	const llmsFullText = await llmsFull.text();
	for (const step of HOW_IT_WORKS_STEPS) {
		expect(llmsFullText).toContain(step);
	}
	expect(llmsFullText).toContain(SECURITY_SECTION_COPY);

	const sitemapIndex = await request.get("/sitemap-index.xml");
	expect(sitemapIndex.ok()).toBeTruthy();
	const sitemapText = await sitemapIndex.text();
	expect(sitemapText).toContain(`${SITE_ORIGIN}/`);
});
