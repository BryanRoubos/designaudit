import { supabase } from "@/lib/supabase";
import { AuditResult } from "@/types/audit";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  const audit = data as AuditResult & { id: string };

  const critical = audit.issues.filter((i) => i.severity === "critical");
  const warnings = audit.issues.filter((i) => i.severity === "warning");
  const info = audit.issues.filter((i) => i.severity === "info");

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Audit results</h1>
      <p className="text-zinc-500 mb-8">{audit.url}</p>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {(
          [
            "overall",
            "accessibility",
            "contrast",
            "performance",
            "seo",
            "typography",
          ] as const
        ).map((key) => (
          <div key={key} className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{audit.scores[key]}</div>
            <div className="text-sm text-zinc-500 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {critical.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Critical</h2>
          <div className="flex flex-col gap-4">
            {critical.map((issue, i) => {
              const suggestion = audit.suggestions.find(
                (s) => s.rule === issue.rule && s.element === issue.element,
              );
              return (
                <div key={i} className="border border-red-200 rounded-lg p-4">
                  <p className="font-mono text-sm text-zinc-500 mb-1">
                    {issue.element}
                  </p>
                  <p>{suggestion?.suggestion ?? issue.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {warnings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-yellow-600 mb-4">
            Warnings
          </h2>
          <div className="flex flex-col gap-4">
            {warnings.map((issue, i) => {
              const suggestion = audit.suggestions.find(
                (s) => s.rule === issue.rule && s.element === issue.element,
              );
              return (
                <div
                  key={i}
                  className="border border-yellow-200 rounded-lg p-4"
                >
                  <p className="font-mono text-sm text-zinc-500 mb-1">
                    {issue.element}
                  </p>
                  <p>{suggestion?.suggestion ?? issue.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {info.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-blue-600 mb-4">Info</h2>
          <div className="flex flex-col gap-4">
            {info.map((issue, i) => {
              const suggestion = audit.suggestions.find(
                (s) => s.rule === issue.rule && s.element === issue.element,
              );
              return (
                <div key={i} className="border border-blue-200 rounded-lg p-4">
                  <p className="font-mono text-sm text-zinc-500 mb-1">
                    {issue.element}
                  </p>
                  <p>{suggestion?.suggestion ?? issue.detail}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
