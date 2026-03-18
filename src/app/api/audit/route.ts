import { audit } from "@/lib/auditor";
import { NextRequest, NextResponse } from "next/server";
import { analyzeIssues } from "@/lib/gemini";
import { getSupabase } from "@/lib/supabase";
import * as z from "zod";

export const UrlSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith("https://"), {
      message: "URL must start with https://",
    }),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid URL" },
      { status: 400 },
    );
  }

  try {
    const { url } = UrlSchema.parse(body);

    const result = await audit(url);

    const { suggestions, summary } = await analyzeIssues(result.issues);
    result.suggestions = suggestions;
    result.summary = summary;

    const { data, error } = await getSupabase()
      .from("audits")
      .insert([result])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ...result, id: data.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error);
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
