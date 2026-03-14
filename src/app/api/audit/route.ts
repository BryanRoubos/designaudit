import { audit } from "@/lib/auditor";
import { NextRequest, NextResponse } from "next/server";
import { analyzeIssues } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
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
  try {
    const body = await req.json();

    // Validate the URL using the schema
    const { url } = UrlSchema.parse(body);

    // Perform the audit
    const result = await audit(url);

    // Analyze issues with Gemini
    const suggestions = await analyzeIssues(result.issues);
    result.suggestions = suggestions;

    // Save the result to Supabase
    const { data, error } = await supabase
      .from("audits")
      .insert([result])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Return the result
    return NextResponse.json({ ...result, id: data.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
