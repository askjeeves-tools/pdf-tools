export interface FaqEntry {
	question: string;
	answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
	{
		question: "Is this PDF converter free?",
		answer:
			"Yes. Every conversion is free with no account, watermark, or usage limit.",
	},
	{
		question: "Is this PDF converter secure?",
		answer:
			"Yes. Files are processed locally in your browser. Nothing is uploaded to a server, so your documents stay on your device.",
	},
	{
		question: "What can I do with my PDF files?",
		answer:
			"You can merge multiple PDFs, split pages into separate files, compress PDFs, export pages to PNG, JPEG, or WebP, extract a page range, or remove unwanted pages.",
	},
	{
		question: "Can I merge multiple PDF files?",
		answer:
			"Yes. Choose Merge PDF, upload two or more PDF files, and download a single combined document.",
	},
	{
		question: "Does the converter work on mobile?",
		answer:
			"Yes. It runs in modern mobile browsers that support HTML5 and JavaScript. Very large files may be slower on mobile devices.",
	},
	{
		question: "What is the maximum file size?",
		answer:
			"Each file can be up to about 50 MB. If a file is too large, you will see a clear error message asking you to use a smaller file.",
	},
	{
		question: "Is there a page limit?",
		answer:
			"Each PDF job can process up to 50 pages. If your document has more pages, split it into smaller files first.",
	},
	{
		question: "Why did my conversion fail?",
		answer:
			"Common causes are a non-PDF file, corrupted PDF data, exceeding the size or page limit, or choosing merge with only one file. Check the message below the converter for specific guidance, then try again or refresh the page.",
	},
];
