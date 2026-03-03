"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SearchResult = {
  type: "player" | "team";
  id: string;
  label: string;
};

export function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const showResults = q.trim().length >= 2 && results.length > 0;

  useEffect(() => {
    if (q.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results ?? []);
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search players or teams"
        className="w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink shadow-input transition-all duration-200 placeholder:text-placeholder focus:border-focus-border focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
      {showResults ? (
        <div className="fade-slide-in absolute z-20 mt-1 w-full overflow-hidden rounded border border-line bg-white shadow-popover">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.type === "player" ? `/players/${r.id}` : `/teams/${r.id}`}
              className="block border-b border-dropdown-line px-3 py-2 text-sm transition-colors duration-150 last:border-b-0 hover:bg-paper-soft"
            >
              <span className="mr-2 text-xs uppercase text-label">{r.type}</span>
              {r.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
