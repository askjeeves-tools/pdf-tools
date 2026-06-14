# Standalone pdf-tools

This repository **is** the standalone export of the PDF Converter tool. For install, run, build, preview, and deploy instructions, see [README.md](README.md).

## Do not

- Copy `tools/pdf-tools/` from the [Ask Jeeves Modules](https://github.com/montana-digital/askjeeves-modules) monorepo — it uses `workspace:*` deps that only work inside the monorepo
- Run `npm install` on an unexported copy — it produces a broken `node_modules` tree
- Commit `node_modules/` or `package-lock.json`

## Re-export after shared package changes

From the monorepo root:

```bash
node scripts/export-standalone-tool.mjs pdf-tools ./export/pdf-tools
```

See [docs/sub-projects.md](https://github.com/montana-digital/askjeeves-modules/blob/main/docs/sub-projects.md) in the upstream repo.
