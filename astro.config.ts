import askJeeves from "@askjeeves/astro-integration";
import { defineConfig } from "astro/config";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
	output: "static",
	site: "https://pdf.askjeeves.cc",
	integrations: [
		askJeeves({
			name: "Ask Jeeves",
			tagline:
				"Convert and edit PDF files in your browser. Nothing leaves your device.",
			version: pkg.version,
			openGraph: {
				home: {
					title: "PDF Converter — Ask Jeeves",
					description:
						"Free PDF merge, split, compress, and image export in your browser.",
				},
			},
		}),
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
