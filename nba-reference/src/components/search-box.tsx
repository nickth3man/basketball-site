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
        className="w-full rounded border border-[#b8ab8f] bg-white px-3 py-2 text-sm text-[#222]"
      />
      {q.trim().length >= 2 && results.length > 0 ? (
        <div className="absolute z-20 mt-1 w-full border border-[#b8ab8f] bg-white shadow">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.type === "player" ? `/players/${r.id}` : `/teams/${r.id}`}
              className="block border-b border-[#eee5d5] px-3 py-2 text-sm hover:bg-[#f8f3e9]"
            >
              <span className="mr-2 text-xs uppercase text-[#836f43]">{r.type}</span>
              {r.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
