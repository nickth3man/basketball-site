import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[#b8ab8f] bg-[#2f2a23] text-[#f2ede1]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide text-[#ffb11b]">
          NBA Reference
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/players" className="hover:text-white">
            Players
          </Link>
          <Link href="/teams" className="hover:text-white">
            Teams
          </Link>
          <Link href="/games" className="hover:text-white">
            Games
          </Link>
          <Link href="/seasons" className="hover:text-white">
            Seasons
          </Link>
        </nav>
      </div>
    </header>
  );
}
