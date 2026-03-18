import { Issue, IssueSuggestion } from "@/types/audit";

export async function analyzeIssues(
  issues: Issue[],
): Promise<{ suggestions: IssueSuggestion[]; summary: string }> {
  if (issues.length === 0)
    return { suggestions: [], summary: "No issues found." };

  const prompt = `You are a web accessibility and performance expert.
  For each numbered issue below, write exactly one plain-English suggestion (2-3 sentences max).
  lso, write a 'summary' of the website health.
  The summary MUST include:
  1. One positive thing the website is doing well (based on the lack of certain issues or high potential).
  2. One or two critical areas that need immediate improvement.
  Issues:
  ${issues.map((i, idx) => `${idx + 1}. Rule: ${i.rule} | Element: ${i.element} | Detail: ${i.detail}`).join("\n")}

  Return ONLY a valid JSON object with these two keys: "suggestions" and "summary".
  No markdown:
  {"suggestions": [{"rule":"...","element":"...","suggestion":"..."}], "summary": "..."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const parsed = JSON.parse(text);
    return {
      suggestions: parsed.suggestions,
      summary: parsed.summary,
    };
  } catch (error) {
    console.error("[analyzeIssues] Failed:", error);
    return { suggestions: [], summary: "" };
  }
}
