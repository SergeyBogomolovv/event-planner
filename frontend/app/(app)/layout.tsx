import Link from "next/link";
import { CalendarDays, LayoutDashboard, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/server-api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 border-r border-zinc-200 bg-white p-6 md:block">
          <Link href="/dashboard" className="text-lg font-semibold">
            Event Planner
          </Link>
          <nav className="mt-8 space-y-2 text-sm">
            <Link className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100" href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Кабинет
            </Link>
            <Link className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-100" href="/profile">
              <UserRound className="h-4 w-4" />
              Профиль
            </Link>
          </nav>
          <div className="mt-8 rounded-lg border border-zinc-200 bg-[#f7f7f2] p-4 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="mt-1 text-zinc-600">{user.email}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{user.role}</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />
              <span className="font-medium">Закрытая зона</span>
            </div>
            <LogoutButton />
          </header>
          <div className="flex-1 p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
