# DesignAudit

**Full website auditor — accessibility, performance, and SEO in one scan.**

Paste in a URL. Get scores, a screenshot, and plain-English fixes you can actually act on.

## Demo
<img width="1920" height="3829" alt="screencapture-designaudit-production-up-railway-app-results-d35afd1a-5a41-4348-9233-038188cb447d-2026-03-25-16_44_52" src="https://github.com/user-attachments/assets/3b31fbaf-8f16-4f3b-98fc-c8c1fd1ea50a" />


## Why I built this

I used to run websneller.nl, a web audit and fix service. The core challenge: how do you quickly show a potential client that their site has real problems worth fixing?

I needed a tool that could:
- Generate **my own scores** across accessibility, performance, and SEO
- Produce a **real dataset** of issues I could use in client conversations
- Be something clients could run themselves, and see the value of hiring someone to fix it

DesignAudit is that tool. It was also a project I used to go deep on the full stack: headless browser automation, API design, AI integration, and persistent storage.

---

## What it does

1. You enter a URL
2. A headless Chrome browser (Puppeteer, 1920×1080 viewport) visits the page and waits for `networkidle2` — fewer than 2 active network requests for 500ms — with a 15-second timeout
3. A viewport screenshot is captured
4. [axe-core](https://github.com/dequelabs/axe-core) runs `wcag2a`, `wcag2aa`, and `best-practice` rules against the live rendered DOM; up to 3 failing nodes are recorded per violation
5. [Lighthouse](https://github.com/GoogleChrome/lighthouse) runs `performance` and `seo` categories on the same browser port (no second launch)
6. Lighthouse issues with weight > 0 and score < 0.9 are merged in, deduped against axe results
7. Five scores are calculated:
   - **Accessibility** — WCAG 2 AA + best-practice violations
   - **Contrast** — color-contrast violations only
   - **Typography** — axe `incomplete` checks on color/font rules
   - **Performance** — Lighthouse Core Web Vitals
   - **SEO** — Lighthouse SEO checks
8. An **overall score** is computed from all five dimensions
9. Google Gemini translates each raw violation into a plain-English explanation
10. The result is saved to Supabase and given a **shareable permalink**

### Real example — websneller.nl

```
Overall: 81/100
Accessibility: 72 | Contrast: 64 | Typography: 95 | Performance: 97 | SEO: 100

CRITICAL - color-contrast - .tracking-wider.uppercase.text-zinc-500  (light gray on dark bg)
CRITICAL - color-contrast - .disabled:opacity-50                      (orange CTA button fails 4.5:1)
CRITICAL - color-contrast - .mt-4                                      (light gray on dark bg)
WARNING  - heading-order  - h4 before h3 skips heading level
WARNING  - landmark-unique - two <nav> elements with no aria-label
WARNING  - largest-contentful-paint - 2.6 s (threshold: 2.5 s)
```

That's 3 real contrast failures on my own site — including the brand orange CTA button — found by my own tool. The LCP warning is real too: 100ms over the threshold.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Browser automation | Puppeteer |
| Accessibility engine | axe-core 4.11 (WCAG 2 AA + best practices) |
| Performance & SEO | Lighthouse 13 |
| AI suggestions | Google Gemini (gemini-flash-lite) |
| Database | Supabase (Postgres) |
| Input validation | Zod v4 |
| Language | TypeScript |

---

## Architecture decisions

**Why Puppeteer instead of a static HTML parser?**

Real accessibility issues only appear on rendered, live pages — after JavaScript has run, styles are applied, and dynamic content has loaded. `networkidle2` waits until fewer than 2 active network requests exist for 500ms, so the page is fully settled before axe runs. Static HTML parsing would miss dynamically injected content and any JS-driven accessibility violations entirely.

**Why Lighthouse alongside axe-core?**

axe-core only covers accessibility. Lighthouse covers performance, SEO, and best practices. Running both in the same Puppeteer session — passing the browser's WebSocket port directly to Lighthouse — means one browser launch gives a complete picture of a site's health with no extra overhead. Lighthouse issues are filtered to those with meaningful weight (`weight > 0`) and low scores (`score < 0.9`), then deduped against anything axe already caught.

**Why `wcag2a`, `wcag2aa`, and `best-practice` in axe?**

`wcag2a` and `wcag2aa` cover the legal baseline. `best-practice` catches things that aren't WCAG violations but still hurt usability — missing lang attributes, deprecated ARIA roles, etc. Together they give a more honest picture than WCAG alone.

**Why cap violations at 3 nodes per rule?**

A single broken pattern (say, every `<p>` using the wrong color) could produce hundreds of identical axe nodes. Capping at 3 per violation keeps the results readable and the API response a reasonable size, while still surfacing every distinct rule failure.

**Why POST instead of GET for the audit endpoint?**

URLs can be long and contain special characters. POST keeps the request clean, avoids browser caching, and makes the intent explicit: this is an action that triggers side effects (a browser launch), not a safe read operation.

**Why Zod for validation?**

The audit spins up a real Chrome browser and visits whatever URL you give it. Validating at the API boundary — not just in the frontend — is the right place to enforce that the URL is valid and uses HTTPS. Never trust the client.

**Why split scoring instead of one metric?**

A site can have great accessibility structure but terrible performance. Splitting into five dimensions tells a more honest story and helps prioritize what to fix first.

**Scoring weights:**

```
Accessibility:  -8 per critical, -2 per warning, -0.5 per info
Contrast:       -12 per color-contrast violation
Typography:     -5 per incomplete color/font check
Performance:    direct Lighthouse score (0–100)
SEO:            direct Lighthouse score (0–100)

Overall = (accessibility × 0.4) + (contrast × 0.2) + (typography × 0.1)
        + (performance × 0.2) + (seo × 0.1)
```

**Why a single Gemini call for all issues?**

One API call for the entire issues array is more efficient than one call per issue. It avoids rate limit problems on large pages and keeps latency reasonable.

**Why Supabase?**

Persistent storage means audit results get a UUID-based permalink. Users can share a result, bookmark it, or come back to it later without re-running the scan.

---

## API

### `POST /api/audit`

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "id": "6937de50-4a29-4415-991c-b8458aaf7c1e",
  "url": "https://example.com",
  "screenshot": "data:image/png;base64,...",
  "issues": [
    {
      "rule": "color-contrast",
      "severity": "critical",
      "element": ".your-class",
      "detail": "Element has insufficient color contrast of 3.99 ..."
    }
  ],
  "scores": {
    "accessibility": 72,
    "contrast": 64,
    "typography": 95,
    "performance": 97,
    "seo": 100,
    "overall": 81
  },
  "suggestions": [
    {
      "rule": "color-contrast",
      "element": ".your-class",
      "suggestion": "The text color is too light against the dark background..."
    }
  ],
  "summary": ""
}
```

**Errors:**
- `400` — URL missing, invalid, or not HTTPS
- `500` — page failed to load or audit error

---

## Running locally

> **Requires Node.js 22.19+** (Lighthouse 13 dependency)

```bash
git clone https://github.com/BryanRoubos/designaudit.git
cd designaudit
npm install
```

Create a `.env.local` file:
```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the dev server:
```bash
npm run dev
```

Test the API:
```bash
# CMD
curl -s -X POST http://localhost:3000/api/audit ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://example.com\"}"
```

---

## License

MIT
