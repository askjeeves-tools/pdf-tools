declare module "ask-jeeves:globals" {
	export const name: string;
	export const tagline: string;
	export const themeColor: string;
	export const twitterHandle: string;
	export const organizationUrl: string;
	export const maxFileBytes: number;
	export const version: string;
	export const openGraph: {
		home: { title: string; description?: string; image?: string };
		blog: { title: string; description?: string; image?: string };
		formats: { title: string; description?: string; image?: string };
	};
}
