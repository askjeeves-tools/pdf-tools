declare module "ask-jeeves:globals" {
	export const name: string;
	export const tagline: string;
	export const themeColor: string;
	export const twitterHandle: string;
	export const maxFileBytes: number;
	export const version: string;
	export const openGraph: {
		home: { title: string; description?: string };
		blog: { title: string; description?: string };
		formats: { title: string; description?: string };
	};
}
