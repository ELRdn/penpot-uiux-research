# Penpot UI/UX Research

> **Plain-language visual version → https://elrdn.github.io/penpot-uiux-research/**


A UI/UX teardown of [Penpot](https://penpot.app) — the open-source design platform — based on passive browser observation (REA + CDP), screenshot evidence, and the design tokens shipped in the public source.

**Start here → [`REPORT.md`](REPORT.md)** (Japanese, with embedded screenshots)

## What's inside

```
REPORT.md                  Full report: structure, design system, audits, findings, fixes
evidence/SOURCES.md        Every URL, evidence ID, and measurement file
evidence/audit-*.json      Raw audit data per page (contrast, alt text, tap targets, headings)
evidence/rea-evidence-bundle.json   REA evidence bundle (6 records)
screenshots/               31 captures (desktop, mobile, app, docs, 404)
scripts/cdp.mjs            Minimal CDP driver (screenshot / text / eval / a11y)
scripts/audit.js           In-page UI/UX audit probe
scripts/menu-check.js      Mobile menu overflow measurement
```

## Headline findings

| Finding | Severity | Evidence |
|---|---|---|
| Pricing rows contradict their values ("Unlimited team size" → "Up to 8 members") | High | `screenshots/03b-pricing-table.webp` |
| Pricing comparison is not a table (0 `<table>`, 0 `role=table`) | High | DOM measurement |
| Mobile menu CTAs overflow the viewport by 17px | Medium | `right=407` vs `viewport=390` |
| Help-center sidebar links are under 24px (65 of 79) | Medium | `evidence/audit-help.json` |
| Feature tabs expose no selected state (`aria-selected` absent) | Medium | DOM measurement |
| Login page has two `h1`s, one empty | Medium | `evidence/audit-app-login.json` |

Strengths worth preserving: a two-tier token system (339 component tokens), 0 contrast failures across 65–97 sampled text nodes on the marketing pages, complete image alt coverage, and a pricing page that discloses funding and discontinuation risk in its FAQ.

## Method

- **Passive observation** via REA `inspect_web_page` (DOM, accessibility tree, resources, storage keys). No JavaScript was evaluated by REA and no page was mutated.
- **Capture** via a small CDP driver that dismisses the cookie banner and triggers lazy media before shooting. Full-page and viewport captures at 1440px and 390px.
- **Design system** read directly from the MPL-2.0 source (`frontend/resources/styles`).
- **Audit** computed in-page: heading outline, landmarks, alt coverage, WCAG contrast ratios, tap-target sizes, motion preferences, layout overflow.

## Limitations

The editor interior is **not** verified: `design.penpot.app` requires an account and none was created. The Workspace section relies on the official annotated interface images and the token definitions. Screen-reader and keyboard walkthroughs are also outstanding.

## License

Documents: CC BY 4.0. Scripts: MIT. Screenshots of the Penpot UI are reproduced for criticism and analysis; rights remain with Kaleidos.
