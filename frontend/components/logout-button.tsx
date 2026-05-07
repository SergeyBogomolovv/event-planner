"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-100 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      Выйти
    </button>
  );
}
