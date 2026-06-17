import askJeeves from "@askjeeves/astro-integration";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import pkg from "./package.json" with { type: "json" };
import {
	SEO_DESCRIPTION,
	SEO_OG_TITLE,
	SEO_SITE_ORIGIN,
} from "./src/seo";

export default defineConfig({
	output: "static",
	site: SEO_SITE_ORIGIN,
	integrations: [
		askJeeves({
			name: "Ask Jeeves",
			tagline: SEO_DESCRIPTION,
			version: pkg.version,
			organizationUrl: "https://askjeeves.cc",
			openGraph: {
				home: {
					title: SEO_OG_TITLE,
					description: SEO_DESCRIPTION,
					image: `${SEO_SITE_ORIGIN}/og.png`,
				},
			},
		}),
		sitemap({ lastmod: new Date() }),
	],
	vite: {
		resolve: { preserveSymlinks: true },
		ssr: {
			noExternal: [
				"@askjeeves/conversion-core",
				"@askjeeves/processors-pdf",
				"@askjeeves/ui",
				"pdfjs-dist",
			],
		},
	},
});
