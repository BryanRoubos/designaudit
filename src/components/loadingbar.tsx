export function LoadingBar({ label, score }: { label: string; score: number }) {
  const colorClass =
    score <= 50 ? "bg-red-500" : score <= 79 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-sm text-zinc-500 capitalize w-28 shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className="text-sm font-semibold w-8 text-right shrink-0"
        style={{
          color: score <= 50 ? "#ef4444" : score <= 79 ? "#f59e0b" : "#22c55e",
        }}
      >
        {score}
      </span>
    </div>
  );
}
