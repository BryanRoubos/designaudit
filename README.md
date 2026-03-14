# DesignAudit

**Automated web accessibility & design quality auditing tool.**

Paste in a URL. Get a score, a screenshot, and plain-English fixes you can actually act on.

---

## Why I built this

I ran [websneller.nl](https://www.websneller.nl), a web agency where we built and improved websites for clients. One recurring challenge: how do you quickly show a potential client that their current site has real problems worth fixing?

I needed a tool that could:
- Generate **my own accessibility and design quality scores** instead of relying on third-party tools
- Produce a **real dataset** of issues I could use in client conversations
- Be something clients could run themselves, and see the value of hiring someone to fix it

DesignAudit is that tool. It was also a project I used to go deep on the full stack — headless browser automation, API design, AI integration, and persistent storage.

---

## What it does

1. You enter a URL
2. A headless Chrome browser visits the page and waits for it to fully load
3. [axe-core](https://github.com/dequelabs/axe-core) runs WCAG 2 AA checks against the live, rendered page
4. Three scores are calculated from real violations:
   - **Accessibility** — WCAG 2 AA compliance (headings, landmarks, ARIA, etc.)
   - **Contrast** — color contrast ratios against WCAG minimums
   - **Typography** — incomplete checks on font and color usage
5. An **overall score** is computed from the three dimensions
6. Google Gemini translates each raw axe violation into a plain-English explanation
7. The result is saved to Supabase and given a **shareable permalink**

### Real example — websneller.nl

```
Overall: 74/100
Accessibility: 72 | Contrast: 64 | Typography: 95

CRITICAL - color-contrast - .text-zinc-500           (ratio 3.99, needs 4.5)
CRITICAL - color-contrast - .disabled:opacity-50     (ratio 3.04, needs 4.5 — the orange CTA button)
CRITICAL - color-contrast - .mt-4                    (ratio 3.73, needs 4.5)
WARNING  - heading-order  - h4 appears before h3
WARNING  - landmark-unique - two nav elements with no distinguishing labels
```

That's 3 real contrast failures on my own site, including the brand orange button that fails WCAG AA. Found by my own tool.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Browser automation | Puppeteer |
| Accessibility engine | axe-core (WCAG 2 AA + best practices) |
| AI suggestions | Google Gemini |
| Database | Supabase (Postgres) |
| Input validation | Zod |
| Language | TypeScript |

---

## Architecture decisions

**Why Puppeteer instead of a static HTML parser?**

Real accessibility issues only appear on rendered, live pages — after JavaScript has run, styles are applied, and dynamic content has loaded. `networkidle2` waits until the page has fewer than 2 active network requests for 500ms, meaning we capture the real state of the page, not just the source HTML.

**Why POST instead of GET for the audit endpoint?**

URLs can be long and contain special characters. POST keeps the URL clean, avoids browser caching issues, and makes the intent explicit: this is an action that triggers side effects (a browser launch), not a safe read operation.

**Why Zod for validation?**

The audit spins up a real Chrome browser and visits whatever URL you give it. Validating at the API boundary — not just in the frontend — is the right place to enforce that the URL is valid and uses HTTPS. Never trust the client.

**Why split scoring instead of one metric?**

A site can have great accessibility structure but terrible color contrast. Splitting into three dimensions tells a more honest story and helps prioritize what to fix first.

**Scoring weights (my own decisions):**

```
Accessibility:  -8 per critical, -2 per warning, -0.5 per info
Contrast:       -12 per color-contrast violation
Typography:     -5 per incomplete color/font check

Overall = (accessibility × 0.5) + (contrast × 0.3) + (typography × 0.2)
```

Accessibility gets the most weight because it directly affects whether your site works for disabled users. Contrast is second because it's a hard WCAG requirement. Typography gets the least because the checks are incomplete by nature.

**Why a single Gemini call for all issues?**

One API call for the entire issues array is more efficient than one call per issue. It avoids rate limit problems on large pages and keeps latency reasonable. The tradeoff is a slightly less focused prompt — acceptable for the use case.

**Why Supabase?**

Persistent storage means audit results get a UUID-based permalink. Users can share a result, bookmark it, or come back to it later without re-running the scan. Supabase Postgres also makes it straightforward to query historical data in the future.

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
    "overall": 74
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
- `500` — page failed to load or axe-core error

---

## Running locally

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
