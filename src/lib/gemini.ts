import { Issue, IssueSuggestion } from "@/types/audit";

export async function analyzeIssues(
  issues: Issue[],
): Promise<IssueSuggestion[]> {
  if (issues.length === 0) return [];

  const prompt = `You are a web accessibility and performance expert.
  For each numbered issue below, write exactly one plain-English suggestion (2-3 sentences max).
  You MUST return exactly ${issues.length} objects in the JSON array, one per issue, in the same order.

  Issues:
  ${issues.map((i, idx) => `${idx + 1}. Rule: ${i.rule} | Element: ${i.element} | Detail: ${i.detail}`).join("\n")}

  Return ONLY a valid JSON array with exactly ${issues.length} objects, no markdown:
  [{"index":1,"rule":"...","suggestion":"..."}]`;

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
