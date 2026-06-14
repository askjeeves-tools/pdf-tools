import type { AstroIntegration } from "astro";
import { z } from "astro/zod";
import { viteVirtualModulePluginBuilder } from "./utils/virtual-module-plugin-builder";

const openGraphOptionsSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
});

export const optionsSchema = z.object({
	name: z.string(),
	tagline: z.string().optional(),
	themeColor: z.string().optional(),
	twitterHandle: z.string().optional(),
	maxFileBytes: z.number().optional(),
	version: z.string().default("0.0.0"),
	openGraph: z.object({
		home: openGraphOptionsSchema,
		blog: openGraphOptionsSchema.optional(),
		formats: openGraphOptionsSchema.optional(),
	}),
});

export default function askJeevesIntegration(
	options: z.infer<typeof optionsSchema>,
): AstroIntegration {
	const validatedOptions = optionsSchema.parse(options);
	const blogOpenGraph =
		validatedOptions.openGraph.blog ??
		validatedOptions.openGraph.formats ??
		validatedOptions.openGraph.home;

	const globals = viteVirtualModulePluginBuilder(
		"ask-jeeves:globals",
		"ask-jeeves-globals",
		`
    export const name = ${JSON.stringify(validatedOptions.name)};
    export const tagline = ${JSON.stringify(validatedOptions.tagline ?? "")};
    export const themeColor = ${JSON.stringify(validatedOptions.themeColor ?? "#8c5cf5")};
    export const twitterHandle = ${JSON.stringify(validatedOptions.twitterHandle ?? "")};
    export const maxFileBytes = ${validatedOptions.maxFileBytes ?? 52_428_800};
    export const version = ${JSON.stringify(validatedOptions.version)};
    export const openGraph = {
      home: ${JSON.stringify(validatedOptions.openGraph.home)},
      blog: ${JSON.stringify(blogOpenGraph)},
      formats: ${JSON.stringify(blogOpenGraph)},
    };
  `,
	);

	return {
		name: "ask-jeeves",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [globals()],
					},
				});
			},
		},
	};
}
