import { Issue, IssueSuggestion } from "@/types/audit";

export async function analyzeIssues(
  issues: Issue[],
): Promise<IssueSuggestion[]> {
  if (issues.length === 0) return [];

  const prompt = `You are a web performance and accessibility expert.
  You will receive a list of issues found on a website. These may be accessibility violations, performance problems, or SEO issues.
  For each issue, write a plain-English explanation for a semi-technical audience (a web developer or business owner).
  Explain: what the problem is, why it matters, and how to fix it.
  Keep each suggestion to 2-3 sentences maximum.

  Issues:
  ${issues.map((i, idx) => `${idx + 1}. Rule: ${i.rule} | Element: ${i.element} | Detail: ${i.detail}`).join("\n")}

  Return ONLY a valid JSON array, no markdown, no explanation:
  [{"rule":"...","element":"...","suggestion":"..."}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();

    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text) as IssueSuggestion[];
  } catch (error) {
    console.error("[analyzeIssues] Failed to parse Gemini response:", error);
    return [];
  }
}
