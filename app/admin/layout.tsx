"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Smile, Heart, MapPin, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/mood", label: "Настроение", icon: Smile },
  { href: "/admin/wishes", label: "Вишлист", icon: Heart },
  { href: "/admin/location", label: "Местоположение", icon: MapPin },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-border p-3 md:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle>Near Admin</SheetTitle>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Выйти
            </Button>
          </SheetContent>
        </Sheet>
        <span className="font-semibold">Near Admin</span>
        <NotificationBell />
      </header>

      <aside className="hidden w-56 flex-col border-r border-border p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold">Near Admin</div>
        <NavLinks />
        <Button variant="ghost" className="justify-start gap-2" onClick={logout}>
          <LogOut className="size-4" />
          Выйти
        </Button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="hidden items-center justify-end border-b border-border px-6 py-3 md:flex">
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
