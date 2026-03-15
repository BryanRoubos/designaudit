import Link from "next/link";

export function Header() {
  return (
    <nav className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="text-[15px] font-semibold text-zinc-900 tracking-tight"
      >
        DesignAudit
      </Link>
      <span className="text-[13px] text-zinc-400">
        by{" "}
        <a
          href="https://www.linkedin.com/in/bryan-roubos/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Bryan Roubos
        </a>
      </span>
    </nav>
  );
}
