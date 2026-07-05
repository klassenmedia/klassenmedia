---
name: world-class-websites
description: Builds modern, professional, world-class websites with refined design, animations and top performance. Use whenever the user asks to create, build, redesign or improve a website, landing page, homepage, portfolio, company site, or web UI — including requests for animations, hero sections, "make it look professional/modern/premium", or converting a design into code.
---

# World-Class Website Development

You build websites that could win design awards: distinctive, fast, accessible, and conversion-focused. Never ship a generic template-looking page. Follow this skill for every website or landing page you create or redesign.

## Step 1 — Brief before building

Establish (ask only if not derivable from context; otherwise decide and state your choices):
- **Purpose & audience**: what should a visitor do (buy, book, contact)? Who are they?
- **Brand personality**: pick 2–3 adjectives (e.g. "precise & premium", "warm & playful", "bold & technical"). Every design decision must serve them.
- **Content**: real text and images available? If not, write strong, specific copy yourself — never lorem ipsum, never "Welcome to our website".
- **Stack**: match the project. Default for new standalone sites: semantic HTML + modern CSS + vanilla JS (no build step) for 1–3 pages; a framework (Astro, Next.js) only when the project genuinely needs it. Respect an existing codebase's stack.

## Step 2 — Design direction (before writing code)

Commit to ONE clear art direction and write it down in 3–4 lines (mood, type pairing, palette, signature element). The #1 failure mode is defaulting to the generic AI look: centered hero, purple-blue gradient, three feature cards with emoji icons, Inter font, rounded-2xl everywhere. Actively avoid it.

**Typography (does 80% of the design work)**
- Pick a characterful display face for headlines + a workhorse for body (self-hosted via @font-face or system stack; never blocking font CDNs if performance matters). Suggested pairings by personality: premium → serif display (e.g. Fraunces, Canela-like) + grotesque; technical → sharp grotesque (e.g. Space Grotesk) + mono accents; editorial → high-contrast serif + humanist sans.
- Type scale with real contrast: hero headlines 3–6rem (clamp()), tight line-height (~1.05–1.15) and slight negative letter-spacing for large sizes; body 1rem–1.125rem, line-height ~1.6, max-width ~65ch.

**Color**
- One dominant neutral family (not pure #000/#fff — use tinted darks/lights), one brand color, one sharp accent used sparingly (<10% of surface). Define as CSS custom properties. Check text contrast: ≥4.5:1 body, ≥3:1 large text.
- Dark or light base — choose deliberately per brand, don't default to dark.

**Layout & spacing**
- Spacing scale (4/8px based) applied consistently; generous whitespace — sections breathe (large paddings ~6–10rem desktop, ~3–5rem mobile).
- Use asymmetry, overlap, varied section rhythms (full-bleed image, split layout, offset grid) instead of stacking identical centered blocks.
- 12-column mental grid; align things ON it. Max content width ~1200–1400px.
- One signature moment: a distinctive hero treatment, an unusual grid, a bold typographic scale, a custom graphic element — something a visitor remembers.

## Step 3 — Build rules

**Semantic, accessible HTML first**
- Real landmarks (`header/nav/main/section/footer`), one `<h1>`, logical heading order, `<button>` for actions, `<a>` for navigation, labels on inputs, alt text on images, `lang` attribute.
- Keyboard: visible focus styles (`:focus-visible`, styled to match the design), logical tab order, skip-link on multi-section pages.

**Modern CSS**
- Custom properties for all design tokens (colors, spacing, type scale, radii, shadows, durations); container queries and `clamp()` for fluid type/spacing; grid + flexbox; `aspect-ratio` for media; logical properties.
- Mobile-first. Test the layout mentally at 360px, 768px, 1280px, 1920px. Nothing may overflow horizontally.
- Depth via layered subtle shadows and soft color tints, not heavy borders. Consistent radii from the token scale.

**Animation & motion (what makes it feel world-class)**
Purposeful, physical, restrained — motion guides attention, it never decorates for its own sake:
- **Micro-interactions**: hover/press states on every interactive element (150–250ms, `ease-out`); transform + opacity only (GPU-friendly), never animate layout properties (width/top/margin).
- **Entrance choreography**: reveal sections on scroll with `IntersectionObserver` (or CSS `animation-timeline: view()` with fallback) — fade + 20–40px translate, 500–700ms, staggered 60–100ms between siblings. Elements above the fold animate on load, once, fast.
- **Scroll depth**: subtle parallax or scroll-linked progress on 1–2 hero elements max; sticky sections only when they serve the narrative.
- **Easing**: custom cubic-bezier (e.g. `cubic-bezier(0.22, 1, 0.36, 1)`) — never linear, never default `ease` for hero moments. Springy easings for playful brands, crisp for premium.
- **Details that sell quality**: smooth counter/number tickers for stats, magnetic or underline-draw link hovers, image scale-on-hover inside `overflow:hidden` frames, animated hamburger→close icon.
- **Always** respect `prefers-reduced-motion: reduce` — provide a media query that disables non-essential motion.
- Library choice: plain CSS/WAAPI for most; GSAP (+ ScrollTrigger) only when complex timeline choreography is genuinely needed; don't pull in a library for a fade-in.

**Performance budget (non-negotiable)**
- LCP element is server-rendered HTML/img (preloaded, `fetchpriority="high"`), never JS-injected. Images: modern formats, `srcset`/`sizes`, explicit width/height (no CLS), `loading="lazy"` below the fold.
- JS minimal and deferred; no jQuery; fonts: `font-display: swap`, preload the 1–2 critical files, subset if possible.
- Target: raw page < ~1.5MB, functional without JS (menus/content readable), Lighthouse ≥90 across the board.

**SEO/GEO baked in**
- Unique title + meta description per page, Open Graph + Twitter tags, favicon set, JSON-LD (`Organization`/`LocalBusiness` + page-appropriate types), sitemap.xml + robots.txt on multi-page sites, clean URLs.
- Content in the HTML (no JS-only text), question-shaped headings where natural, concrete facts. If the seo-geo-audit skill is available, run its checklist mentally against the finished site.

## Step 4 — Copy & imagery

- Headlines state a concrete benefit or bold claim, not "Willkommen". Subheads explain in one sentence. One primary CTA per view, verb-first ("Projekt anfragen"), repeated near the end.
- Real social proof where available (logos, numbers, quotes). Never invent testimonials or client names — use clearly marked placeholders the user must replace.
- Placeholder imagery: build tasteful CSS/SVG-based visuals (gradients, patterns, abstract shapes matching the palette) rather than hotlinking stock photos; mark where the user should drop in real photos.

## Step 5 — QA before declaring done

Walk this list against the actual code:
- [ ] Distinct design direction visible — would this pass for a hand-crafted agency site? No generic AI-template look?
- [ ] Responsive: no horizontal overflow, readable and well-composed at 360px and 1920px?
- [ ] Every interactive element has hover/focus/active states; keyboard navigation works; contrast ratios pass?
- [ ] Animations: smooth (transform/opacity only), staggered reveals working, `prefers-reduced-motion` handled?
- [ ] Performance: images sized/lazy, fonts swapped, JS deferred, no CLS from unsized media?
- [ ] SEO/GEO: title, description, OG tags, JSON-LD, semantic headings, content in raw HTML?
- [ ] Copy: no lorem ipsum, no invented facts/testimonials, one clear CTA?
- [ ] Open the site (browser/screenshot) if the environment allows and visually verify — don't ship unseen.

If any box fails, fix it before finishing. Then hand over with a short note: design direction chosen, how to replace placeholders, and how to deploy/preview.
