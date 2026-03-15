import { LoadingBar } from "@/components/loadingbar";
import { getSupabase } from "@/lib/supabase";
import { AuditResult } from "@/types/audit";
export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await getSupabase()
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  const audit = data as AuditResult & { id: string };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">
            Audit results
          </h1>
          <p className="text-sm text-zinc-400 font-mono">{audit.url}</p>
        </div>

        {/* scores card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-8">
          <div
            className="text-5xl font-bold mb-1 justify-center flex"
            style={{
              color:
                audit.scores.overall <= 50
                  ? "#ef4444"
                  : audit.scores.overall <= 79
                    ? "#f59e0b"
                    : "#22c55e",
            }}
          >
            {audit.scores.overall}
          </div>
          <div className="text-sm text-zinc-500 mb-6 justify-center flex">
            Overall score
          </div>
          {(
            [
              "accessibility",
              "contrast",
              "performance",
              "seo",
              "typography",
            ] as const
          ).map((key) => (
            <LoadingBar key={key} label={key} score={audit.scores[key]} />
          ))}
        </div>

        {/* screenshot */}
        {audit.screenshot && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-zinc-700">
                Screenshot
              </h2>
            </div>
            <img
              src={audit.screenshot}
              alt="Website screenshot"
              className="w-full"
            />
          </div>
        )}

        {/* issues */}
        <h2 className="text-lg font-semibold mb-4">Issues</h2>
        <div className="flex flex-col gap-4">
          {audit.issues.map((issue, i) => {
            const suggestion = audit.suggestions.find(
              (s) => s.rule === issue.rule,
            );
            const borderColor =
              issue.severity === "critical"
                ? "border-red-200"
                : issue.severity === "warning"
                  ? "border-amber-200"
                  : "border-blue-200";
            const badgeColor =
              issue.severity === "critical"
                ? "bg-red-100 text-red-700"
                : issue.severity === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700";

            return (
              <div
                key={i}
                className={`bg-white rounded-xl border ${borderColor} p-5 shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${badgeColor}`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {issue.rule}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-500 mb-2">
                  {issue.element}
                </p>
                <p
                  className="text-sm text-zinc-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: (suggestion?.suggestion ?? issue.detail)
                      .replace(
                        /\[([^\]]+)\]\(([^)]+)\)/g,
                        '<a href="$2" target="_blank" class="text-zinc-500 underline">$1</a>',
                      )
                      .replace(/<(?!a\b|\/a)[^>]+>/gi, ""),
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
