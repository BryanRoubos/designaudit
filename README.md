# DesignAudit

**Automated web accessibility & design quality auditing tool.**

Paste in a URL. Get a score, a screenshot, and plain-English issues you can actually fix.

---

## Why I built this

I ran [websneller.nl](https://www.websneller.nl), a web agency where we built and improved websites for clients. One thing that kept coming up: how do you quickly show a potential client that their current website has problems worth fixing?

I needed:
- A way to generate my **own accessibility and design quality scores** instead of relying on third-party tools
- A **real dataset** of issues I could use to have better conversations with clients
- A tool clients could use themselves to check their own site, and see the value of working with someone like me

DesignAudit is that tool. It was also a project I built to deeply understand the full stack, from headless browser automation to API design to AI integration.

---

## What it does

1. You enter a URL
2. The tool launches a headless Chrome browser and visits the page
3. It runs **axe-core**, the same accessibility engine used by the W3C and major browser devtools, against the live page
4. It calculates **three scores** based on real violations:
   - **Accessibility**, WCAG 2 AA compliance (headings, landmarks, ARIA, etc.)
   - **Contrast**, color contrast ratios against WCAG minimums
   - **Typography**, incomplete checks on font and color usage
5. It returns an **overall score**, a **full list of issues**, and a **screenshot** of what the page looked like at the time of audit

### Real example — websneller.nl

```
Overall: 74/100
Accessibility: 72 | Contrast: 64 | Typography: 95

Issues found:
CRITICAL - color-contrast - .text-zinc-500           (ratio 3.99, needs 4.5)
CRITICAL - color-contrast - .disabled:opacity-50     (ratio 3.04, needs 4.5 — the orange button)
CRITICAL - color-contrast - .mt-4                    (ratio 3.73, needs 4.5)
WARNING  - heading-order  - h4 appears before h3
WARNING  - landmark-unique - two nav elements with no distinguishing labels
```

That's 3 real contrast failures on my own site, including the brand orange button that fails WCAG AA. Found by my own tool.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| Browser automation | Puppeteer |
| Accessibility engine | axe-core (WCAG 2 AA + best practices) |
| Input validation | Zod |
| Language | TypeScript |

---

## Architecture decisions

**Why Puppeteer instead of a static HTML parser?**

Real accessibility issues only appear on rendered, live pages, after JavaScript has run, styles are applied, and dynamic content is loaded. `networkidle2` waits until the page has fewer than 2 active network requests for 500ms, meaning we capture the real state of the page, not just the HTML source.

**Why POST instead of GET for the audit endpoint?**

URLs can be long and contain special characters. POST keeps the URL clean, avoids browser caching issues, and makes the intent clear: this is an action that triggers side effects (a browser launch), not a safe read operation.

**Why Zod for validation?**

The audit spins up a real Chrome browser and visits whatever URL you give it. Validating at the API boundary, not just in the frontend, is the right place to enforce that the URL is valid and uses HTTPS. Never trust the client.

**Why split scoring instead of one single metric?**

A site can have great accessibility structure but terrible color contrast. Splitting into three dimensions (accessibility, contrast, typography) tells a more honest story and helps prioritize what to fix first.

**Scoring weights (my own decisions):**

```
Accessibility:  -8 per critical, -2 per warning, -0.5 per info
Contrast:       -12 per color-contrast violation
Typography:     -5 per incomplete color/font check

Overall = (accessibility × 0.5) + (contrast × 0.3) + (typography × 0.2)
```

Accessibility gets the most weight because it directly affects whether your site works for disabled users. Contrast is second because it's a WCAG hard requirement. Typography gets the least because the checks are incomplete by nature.

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

## Roadmap

- [ ] Frontend UI — score cards, screenshot display, issue list
- [ ] AI-powered fix suggestions (Gemini) — plain English explanations of how to fix each issue
- [ ] Supabase — auth, shareable report permalinks
- [ ] HMAC-signed reports — tamper-proof audit results
- [ ] Deploy — Vercel (frontend) + Railway (Puppeteer backend)
- [ ] Embed on websneller.nl as a lead generation tool

---

## License

MIT
