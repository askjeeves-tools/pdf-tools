import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_ROOT = join(
	dirname(fileURLToPath(import.meta.url)),
	"../fixtures",
);

export function fixturePath(name: string): string {
	return join(FIXTURES_ROOT, name);
}

export async function loadFixtureFile(
	name: string,
	type?: string,
): Promise<File> {
	const buffer = await readFile(fixturePath(name));
	const ext = name.slice(name.lastIndexOf("."));
	const mime =
		type ??
		{
			".csv": "text/csv",
			".json": "application/json",
			".txt": "text/plain",
			".pdf": "application/pdf",
			".xlsx":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		}[ext] ??
		"application/octet-stream";
	return new File([buffer], name, { type: mime });
}
