import type { Plugin } from "vite";

export function viteVirtualModulePluginBuilder(
	moduleId: string,
	name: string,
	moduleContent: string,
) {
	return function modulePlugin(): Plugin {
		const resolvedVirtualModuleId = `\0${moduleId}`;

		return {
			name,
			resolveId(id) {
				if (id === moduleId) {
					return resolvedVirtualModuleId;
				}
				return;
			},
			load(id) {
				if (id === resolvedVirtualModuleId) {
					return moduleContent;
				}
				return;
			},
		};
	};
}
