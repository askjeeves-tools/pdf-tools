# pdf-tools UI & SEO Architecture Guide

Reference implementation for Ask Jeeves single-page converter sites. This document describes the `pdf.askjeeves.cc` deployment. Sibling tools (e.g. `png.askjeeves.cc`, `webp.askjeeves.cc`) follow the same pattern.

---

## 1. Project shape

| Layer | Role |
|-------|------|
| **Project-local** (`src/`, `tool.config.ts`, `public/`) | Tool-specific SEO copy, FAQ, structured data, llms files, processors |
| **Vendor shared** (`vendor/@askjeeves/*`) | Reusable layout, converter shell, head/footer, CSS, client controller, Astro integration |
| **Build pipeline** | `prebuild` regenerates OG images + llms.txt; `@astrojs/sitemap` emits sitemap at build |

**Stack:** Astro 6 static site, pnpm, Playwright E2E, Vitest unit tests, Cloudflare Pages deploy.

**Single route:** `src/pages/index.astro` — one homepage, no multi-page SEO routing.

---

## 2. UI structure and content

### 2.1 Page composition (top → bottom)

```
<head>  ToolHead: meta, OG, Twitter, llms alternates
        ToolStructuredData: JSON-LD @graph
<body>  <main max-width 820px>
          ConverterShell — hero grid + interactive tool
          SeoContent — collapsible SEO sections
          ToolFooter — hub link + version
```

**Visual hierarchy:**

1. **Hero converter** — primary UX; mascot + title + drop zone + convert panel
2. **SEO content block** — secondary, below the fold; always in DOM for crawlers
3. **Footer** — brand hub link, project name, package version

### 2.2 Hero / converter UI (`vendor/@askjeeves/ui/components/ConverterShell.astro`)

Dark theme (`#0b0b0b`), purple accent (`--primary: #8c5cf5`), monospace headings.

```
#converter-root.tool-hero-page
└── .tool-hero-body (CSS grid: mascot | panel)
    ├── MascotGraphic variant="hero"
    └── .tool-hero-panel
        ├── h1 ← toolConfig.title (SEO_BRAND_TITLE)
        ├── p.tool-tagline ← toolConfig.tagline (SEO_DESCRIPTION)
        ├── #tool-drop-zone (file upload)
        ├── details.supported-conversions-expander (closed by default)
        ├── #tool-convert-panel (JS-populated output format radios)
        ├── progress / #tool-status / #tool-download
        └── privacy note
```

**Config-driven behavior** (`tool.config.ts`):

- `title`, `tagline`, `sourceFormat`, `allowsMultiple`, `accept` → static SSR markup
- `conversions[]` with `enabled`, `label`, `options`, `id` → hero expander list + client radio buttons
- Client `initToolController` binds to fixed element IDs; `src/scripts/processors.ts` keys must match conversion `id` exactly

**Enabled PDF conversions (8):**

| id | label |
|----|-------|
| `pdf-extract` | Extract page range → PDF |
| `pdf-split-zip` | Split all pages → ZIP of PDFs |
| `pdf-png` | Pages → PNG (ZIP if multiple) |
| `pdf-to-jpeg` | PDF → JPEG(s) |
| `pdf-to-webp` | PDF → WebP(s) |
| `pdf-remove-pages` | Remove pages from PDF |
| `pdf-compress` | Compress PDF |
| `pdf-merge` | Merge PDF |

### 2.3 On-page SEO content (`src/components/SeoContent.astro`)

Mirrors hero expander UX (`details.seo-expander`, ▸ chevron, purple hover) but lives below the tool.

| Section | Source | Purpose |
|---------|--------|---------|
| Intro (`h2` + paragraphs) | `SEO_DESCRIPTION` + static copy | Keyword-rich lead paragraph |
| How it works | `HOW_IT_WORKS_STEPS` from `src/seo-copy.ts` | Ordered steps |
| Supported conversions | `getEnabledConversions()` + `CONVERSION_DESCRIPTIONS` | Longer per-feature descriptions |
| Secure and private | `SECURITY_SECTION_COPY` | Privacy/local-processing messaging |
| FAQ | `FAQ_ENTRIES` from `src/faq.ts` | Q&A with `h3` per question |
| Related tools | `RELATED_TOOLS` from `src/related-tools.ts` | Outbound links to sibling `*.askjeeves.cc` sites (excludes `pdf.askjeeves.cc`) |

**Intentional duplication:** Hero has a short conversion list; `SeoContent` has expanded descriptions. Both are crawlable; E2E tests verify both.

### 2.4 Styling layers

Import chain in `vendor/@askjeeves/ui/styles/index.css`:

- `reset.css` — dark base, typography
- `globals.css` — CSS vars, main layout (`min(100%, 820px)`), `.hidden`, noscript notice
- `forms.css` — primary/secondary buttons
- `converter.css` — drop zone, convert panel, options, progress
- `tool-hero.css` — hero grid; stacks at `640px`
- `tool-footer.css` — footer bar

Project-local scoped styles only in `SeoContent.astro` (max-width `42rem`, muted white text).

### 2.5 Accessibility patterns

- Drop zone: `role="button"`, `tabindex="0"`, descriptive `aria-label`
- Status region: `#tool-status` with `aria-live="polite"` (set by controller)
- SEO sections: `aria-label` on each `<details>`
- Noscript fallback in `ToolLayout.astro` with hub link

---

## 3. SEO implementation inventory

### 3.1 Single source of truth (`src/seo.ts`)

All meta/OG constants in one file:

| Export | Purpose |
|--------|---------|
| `SEO_SITE_ORIGIN` | `https://pdf.askjeeves.cc` — used in astro.config, llms generator, tests |
| `SEO_BRAND_TITLE` | `"Free Secure PDF Converter"` — H1, WebApplication name, tool title |
| `SEO_SITE_NAME` | `"Ask Jeeves"` |
| `SEO_DOCUMENT_TITLE` | `"<brand> \| <site>"` → `<title>` |
| `SEO_OG_TITLE` | `"<brand> — <site>"` → og:title (different punctuation) |
| `SEO_DESCRIPTION` | meta description, tagline, og:description |
| `SEO_OG_IMAGE_*` | alt, 1200×630, en_US |
| `SEO_KEYWORDS` | JSON-LD only (no HTML meta keywords tag) |

**Critical split:** Document `<title>` comes from page props; OG/Twitter title comes from `ask-jeeves:globals` → `openGraph.home.title`. They are deliberately different strings.

### 3.2 Astro config wiring (`astro.config.ts`)

```ts
site: SEO_SITE_ORIGIN   // REQUIRED for canonical, sitemap, OG absolute URLs
output: "static"

integrations:
  askJeeves({ name, tagline, organizationUrl, version, openGraph.home })
  sitemap({ lastmod: new Date() })
```

The `askJeeves` integration registers virtual module `ask-jeeves:globals` consumed by `ToolHead`, `ToolFooter`, and `index.astro` (`maxFileBytes`).

### 3.3 Head tags (`vendor/@askjeeves/ui/components/ToolHead.astro`)

| Category | Tags |
|----------|------|
| Basics | charset, viewport, theme-color, favicon.ico, 32×32 PNG, apple-touch-icon |
| LLM discovery | `<link rel="alternate" type="text/plain">` for `/llms.txt` and `/llms-full.txt` |
| Canonical | `Astro.site` + pathname |
| Meta | title, description |
| Open Graph | title, description, url, type, site_name, image (+ width/height/alt/locale) |
| Twitter | summary_large_image, title, description, image |
| Structured data | Delegates to `ToolStructuredData` |

Throws if `Astro.site` is unset — enforced in both `ToolHead` and `index.astro`.

### 3.4 JSON-LD graph (`src/seo-structured-data.ts`)

`buildPdfToolsExtraGraph(siteOrigin, featureList)` returns 5 linked `@graph` entities:

| @type | @id suffix | Key fields |
|-------|------------|------------|
| Organization | `#organization` | Ask Jeeves, `https://askjeeves.cc` |
| WebSite | `#website` | name, inLanguage, publisher link |
| WebApplication | `#app` | featureList from enabled conversions, keywords, free Offer, PDFConverter subcategory |
| FAQPage | `#faq` | mainEntity from `FAQ_ENTRIES` |
| HowTo | `#howto` | steps from `HOW_IT_WORKS_STEPS`, description from security copy |

Entities link via `isPartOf: { "@id": websiteId }`. Passed as `structuredDataGraph` prop from `index.astro` — overrides vendor default graph.

### 3.5 LLM discovery files (`src/llms.ts`)

- **`llms.txt`** — short summary: tool link, conversions, FAQ bullets, link to full file, hub
- **`llms-full.txt`** — extends short file with how-it-works, security, per-conversion details, keywords, canonical, sitemap, org link

Generated at build by `scripts/generate-llms-txt.ts` → `public/llms*.txt`. Same modules as HTML/JSON-LD — no hand-editing.

### 3.6 Static SEO assets

| File | Role |
|------|------|
| `public/og.png` | 1200×630 social image (generated) |
| `public/favicon.ico`, `apple-touch-icon.png` | Generated by `scripts/generate-seo-images.mjs` |
| `public/robots.txt` | Allow all + sitemap URL |
| `public/_headers` | CDN cache: 1yr immutable for images; 24h for robots/llms |
| `dist/sitemap-index.xml` | Emitted by `@astrojs/sitemap` at build |

**Build hook:** `prebuild` runs `generate:seo-images` then `generate:llms-txt` before every `astro build`.

### 3.7 SEO regression tests (`tests/e2e/seo-head.spec.ts`)

Playwright tests import constants from `src/seo`, `faq`, `seo-copy` — same source as production. Verifies title, description, canonical, OG/Twitter, LLM alternates, JSON-LD graph, on-page content (8 conversions, 8 FAQ items), static files, and noscript notice.

`pretest:e2e` runs full build so generated assets exist in `dist/`.

---

## 4. Data flow (config → rendered output)

```
src/seo.ts
    ├── astro.config.ts → askJeeves({ openGraph }) → ask-jeeves:globals → ToolHead
    ├── tool.config.ts (title, tagline)
    │       ├── ConverterShell (SSR)
    │       ├── index.astro (featureList → JSON-LD)
    │       └── seo-content.ts → SeoContent
    ├── seo-copy.ts / faq.ts
    │       ├── seo-structured-data.ts → JSON-LD
    │       ├── SeoContent.astro → HTML
    │       └── llms.ts → prebuild → public/llms*.txt
    └── index.astro → ToolLayout → ToolHead + ConverterShell + SeoContent
```

**Three-way config consumption of `tool.config.ts`:**

1. **SSR** — `ConverterShell` renders title, tagline, conversion list
2. **Schema** — enabled conversion labels → `featureList` in JSON-LD
3. **Client** — `initToolController` builds output-format UI from conversions

---

## 5. Design principles to preserve

1. **One source for strings** — pages, JSON-LD, llms.txt, and E2E tests import the same modules; never duplicate copy inline
2. **Separate document title vs OG title** — `<title>` uses pipe (`|`), OG uses em dash (`—`); both derive from `seo.ts`
3. **Custom JSON-LD graph** — pass full `@graph` to override vendor defaults when FAQ/HowTo/WebSite are needed
4. **Collapsible on-page SEO** — full text in DOM, closed by default, low visual weight; hero stays clean
5. **Feature list from config** — enabling/disabling conversions auto-updates schema, llms, hero list, and SEO section
6. **LLM files as first-class** — linked in `<head>`, regenerated on every build
7. **Absolute OG image URL** — social crawlers need full URL in astro.config, not relative path
8. **Require Astro.site** — fail fast if canonical/sitemap/OG URLs cannot be resolved

---

## 6. What is NOT implemented (gaps for future tools)

- HTML `<meta name="keywords">` (keywords only in JSON-LD)
- hreflang / multi-locale
- BreadcrumbList schema
- Per-route SEO (single-page only)
- Twitter handle (empty default in integration)
- RSS feed

---

## 7. Vendor package boundaries

| Package | Provides |
|---------|----------|
| `@askjeeves/ui` | `ToolLayout`, `ToolHead`, `ToolStructuredData`, `ConverterShell`, `MascotGraphic`, `ToolFooter`, CSS, `tool-controller` |
| `@askjeeves/conversion-core` | `ToolConfig` types, `createToolConfig`, validation helpers |
| `@askjeeves/astro-integration` | `ask-jeeves:globals` virtual module |
| `@askjeeves/processors-pdf` | PDF merge/split/compress/image export (project wires via `processors.ts`) |

**Project adds:** SEO copy modules, `SeoContent`, structured-data builder, llms builders, tool config, processors, E2E SEO tests, generated static assets.

---

## 8. File reference (this repo)

| File | Role |
|------|------|
| `src/seo.ts` | Canonical SEO constants |
| `src/seo-copy.ts` | How-it-works, security, conversion descriptions |
| `src/seo-content.ts` | Bridge to tool.config for enabled conversions |
| `src/faq.ts` | FAQ shared by HTML, JSON-LD, llms |
| `src/related-tools.ts` | Cross-links to sibling tools |
| `src/seo-structured-data.ts` | JSON-LD `@graph` builder (`buildPdfToolsExtraGraph`) |
| `src/llms.ts` | llms.txt / llms-full.txt builders |
| `src/components/SeoContent.astro` | On-page SEO sections |
| `src/pages/index.astro` | Page wiring |
| `tool.config.ts` | Tool identity and conversions |
| `astro.config.ts` | Site URL, integrations |
| `scripts/generate-seo-images.mjs` | OG image + favicons |
| `scripts/generate-llms-txt.ts` | llms file generation |
| `public/robots.txt` | Crawler directives |
| `public/_headers` | CDN cache headers |
| `tests/e2e/seo-head.spec.ts` | SEO regression tests |
| `tests/processor-alignment.test.ts` | Vitest processor/config alignment |
