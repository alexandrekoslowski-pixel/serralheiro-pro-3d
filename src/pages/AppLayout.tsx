import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Wrench, Menu, X, Building2, FolderKanban, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  // fecha drawer ao mudar de rota
  if (open && loc.pathname) {
    // não em useEffect: queremos sempre fechar quando o path muda, sem flicker
  }

  const navItems = [
    { to: "/app", end: true, label: "Projetos", icon: FolderKanban },
    { to: "/app/configuracoes", end: false, label: "Empresa", icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className="grid h-9 w-9 place-items-center rounded border border-border md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Link to="/app" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-gradient-orange shadow-orange">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-sm sm:text-base">Serralheiro Pro 3D</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded px-3 py-1.5 text-sm transition",
                    isActive ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
                  )
                }
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </NavLink>
            ))}
          </nav>

          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Sair do app
            </Link>
          </Button>
        </div>

        {/* drawer mobile */}
        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="container flex flex-col gap-1 py-2">
              {navItems.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded px-3 py-2 text-sm",
                      isActive ? "bg-card" : "hover:bg-card",
                    )
                  }
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
