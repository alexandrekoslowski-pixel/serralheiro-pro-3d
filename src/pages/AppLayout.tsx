import { Link, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Wrench, Menu, X, Building2, FolderKanban, LayoutDashboard, Wallet, LogOut, CalendarDays, Users, Package, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessao } from "@/lib/sessao";
import { projetosLocaisPendentes, importarLocaisParaNuvem } from "@/lib/storage";
import type { Papel } from "@/lib/gestao";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const { sair, papel } = useSessao();

  useEffect(() => { setPendentes(projetosLocaisPendentes()); }, []);

  const importar = async () => {
    try {
      const n = await importarLocaisParaNuvem();
      setPendentes(0);
      toast.success(`${n} orçamento(s) enviados para a sua conta`);
    } catch { toast.error("Não foi possível enviar os orçamentos"); }
  };

  const todos: { to: string; end: boolean; label: string; icon: typeof Users; papeis: Papel[] }[] = [
    { to: "/app", end: true, label: "Painel", icon: LayoutDashboard, papeis: ["gestor", "vendedora"] },
    { to: "/app/oficina", end: false, label: papel === "serralheiro" ? "Minhas ordens" : "Oficina", icon: Wrench, papeis: ["gestor", "vendedora", "serralheiro"] },
    { to: "/app/clientes", end: false, label: "Clientes", icon: Users, papeis: ["gestor", "vendedora"] },
    { to: "/app/projetos", end: false, label: "Orçamentos", icon: FolderKanban, papeis: ["gestor", "vendedora"] },
    { to: "/app/calendario", end: false, label: "Calendário", icon: CalendarDays, papeis: ["gestor", "vendedora"] },
    { to: "/app/catalogo", end: false, label: "Serviços", icon: BookOpen, papeis: ["gestor"] },
    { to: "/app/materiais", end: false, label: "Materiais", icon: Package, papeis: ["gestor"] },
    { to: "/app/financeiro", end: false, label: "Financeiro", icon: Wallet, papeis: ["gestor"] },
    { to: "/app/equipe", end: false, label: "Equipe", icon: ShieldCheck, papeis: ["gestor"] },
    { to: "/app/configuracoes", end: false, label: "Empresa", icon: Building2, papeis: ["gestor"] },
  ];
  const navItems = todos.filter((it) => it.papeis.includes(papel));


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

          <Button variant="outline" size="sm" onClick={sair}>
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sair
          </Button>
        </div>

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
                    cn("flex items-center gap-2 rounded px-3 py-2 text-sm", isActive ? "bg-card" : "hover:bg-card")
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

      {pendentes > 0 && (
        <div className="border-b border-border bg-card">
          <div className="container flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>{pendentes} orçamento(s) antigos estão salvos só neste aparelho.</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={importar} className="bg-gradient-orange text-primary-foreground">Enviar para minha conta</Button>
              <Button size="sm" variant="soft" onClick={() => setPendentes(0)}>Agora não</Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
