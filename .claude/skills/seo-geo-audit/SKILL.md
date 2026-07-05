---
name: seo-geo-audit
description: Audits websites for SEO, GEO (Generative Engine Optimization) and AI-readiness, producing a scored report with a prioritized action plan for maximum visibility in Google and AI answers (ChatGPT, Claude, Perplexity, Google AI Overviews). Use when the user provides a URL/domain and asks to check, audit, analyze or improve a website's SEO, GEO, AI visibility, rankings, structured data, llms.txt, or asks "why is my site not found".
---

# SEO / GEO / AI-Readiness Website Audit

You audit a website and deliver a scored, actionable report. The goal is maximum visibility in **both** classic search engines (SEO) **and** AI answer engines like ChatGPT, Claude, Perplexity and Google AI Overviews (GEO).

Write the final report in the user's language. Be honest about what you could not measure.

## Step 1 — Gather data

Fetch these resources (WebFetch, or `curl -sL` when raw HTML/headers are needed). Never fake a result — if a fetch fails, record it as "not verifiable" and move on:

1. `https://<domain>/` — the homepage HTML (raw, to inspect actual markup)
2. 2–4 key subpages if the user names them or they're linked prominently (services, products, blog post, about)
3. `https://<domain>/robots.txt`
4. `https://<domain>/sitemap.xml` (also check locations declared in robots.txt)
5. `https://<domain>/llms.txt` and `/llms-full.txt`
6. HTTP response headers of the homepage (`curl -sI`): status, redirects (http→https, www), caching, `X-Robots-Tag`
7. If a JS framework is suspected: compare raw HTML (`curl`) with rendered content — is the main content present without JavaScript?

## Step 2 — Analyze five categories

### A. Technical SEO & crawlability (weight 20%)
- HTTPS enforced, exactly one canonical host (www vs non-www), no redirect chains
- robots.txt: valid, doesn't block important paths, references sitemap
- sitemap.xml: exists, valid, contains real URLs, `lastmod` plausible
- Meta robots / X-Robots-Tag: nothing important set to noindex
- Canonical tags present and self-consistent
- Clean URL structure (speaking URLs, no session params)
- hreflang if multilingual; 404 handling returns real 404

### B. On-page SEO (weight 25%)
- `<title>`: unique, ~50–60 chars, primary topic at the front
- Meta description: present, ~150–160 chars, contains a reason to click
- Exactly one H1; logical H2/H3 hierarchy that outlines the content
- Content: substantive, covers the topic, answers the search intent; thin/duplicate content flagged
- Images: descriptive `alt` attributes, meaningful filenames
- Internal linking: important pages reachable within 2–3 clicks, descriptive anchor texts
- Language declared (`<html lang>`), no keyword stuffing

### C. Structured data & metadata (weight 20%)
- JSON-LD present and matching the page type: `Organization`/`LocalBusiness` (with name, logo, address, `sameAs` to social profiles), `WebSite`, `BreadcrumbList`, plus `Article`, `Product`, `FAQPage`, `Service` where applicable
- Validate required properties of each schema type; flag syntax errors
- Open Graph (`og:title`, `og:description`, `og:image`) and Twitter Card tags
- Favicon and social preview image present

### D. GEO / AI answer-engine readiness (weight 25%)
This is what makes a site citable by AI systems:
- **AI crawler access** in robots.txt: check `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-User`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`. Report which are allowed/blocked. Blocking them = invisible in those AI answers; note this is the user's strategic choice, but for visibility they should be allowed.
- **llms.txt**: exists? Recommend one: a concise Markdown map of the site's key pages and what the business does.
- **Content without JavaScript**: main content must be in the raw HTML (server-rendered). JS-only content is invisible to most AI crawlers.
- **Answer-shaped content**: direct answers in the first sentences of a section; questions as headings (FAQ pattern); one clear topic per page.
- **Quotable facts**: concrete numbers, dates, prices, comparisons — AI engines cite specifics, not marketing prose.
- **Entity clarity**: who/what/where the business is, stated consistently in text and schema; `sameAs` links connecting the brand to its profiles.
- **E-E-A-T signals**: named authors with bios, publish/updated dates, imprint/about page, sources for claims, testimonials/credentials.
- **Semantic HTML**: real `<article>`, `<section>`, lists and tables (extractable) instead of div-soup; no critical info only inside images.

### E. Performance & mobile (weight 10%)
Only what's measurable without a browser lab:
- Viewport meta tag, responsive hints
- Page weight of raw HTML, number of render-blocking scripts/styles in `<head>`
- Modern image formats (webp/avif), lazy loading, compression (`content-encoding`), caching headers
- State clearly that real Core Web Vitals need PageSpeed Insights / Search Console — link the user there, don't invent scores.

## Step 3 — The report

Structure the report exactly like this:

1. **Gesamtergebnis**: overall score 0–100 (weighted by category) + one-line verdict.
2. **Score-Tabelle**: the five categories with score, grade (🟢 ≥80 / 🟡 50–79 / 🔴 <50) and one-line summary each.
3. **Kritische Probleme** (fix now — things that actively prevent visibility, e.g. noindex, blocked crawlers, no HTTPS, JS-only content)
4. **Wichtige Verbesserungen** (high impact: missing schema, weak titles, no llms.txt, thin content)
5. **Feinschliff** (nice-to-have)
6. **Maßnahmenplan für maximale Sichtbarkeit**: numbered, ordered by impact/effort — quick wins first. Every item names the concrete action ("Add FAQPage-JSON-LD to /leistungen with these 5 questions: …"), not generic advice ("improve your content").
7. **Nicht prüfbar**: what this audit cannot see — real rankings, backlinks, traffic, Core Web Vitals field data, Google Business Profile — and which free tool covers each (Google Search Console, PageSpeed Insights, Google Business Profile).

For every finding: state **what** is wrong, **where** (URL/element), **why it matters**, and **the concrete fix** — with a ready-to-paste code snippet (title tag, JSON-LD block, robots.txt lines, llms.txt draft) whenever possible.

If the environment supports Artifacts, additionally offer the report as a formatted page; otherwise Markdown in chat is fine.

## Rules

- Audit only sites the user owns or is authorized to analyze; fetching public pages for analysis is fine.
- Never invent data. Every score must trace to an observed fact. If key pages couldn't be fetched, cap the affected category's confidence and say so.
- If the site is fine in an area, say so briefly — don't pad the report with fake problems.
- If the user asks for a re-audit after fixes, compare against the previous scores and highlight deltas.
