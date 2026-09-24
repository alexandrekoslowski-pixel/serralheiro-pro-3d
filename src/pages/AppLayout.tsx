import { Link, NavLink, Outlet } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Wrench, Menu, X, Building2, FolderKanban, LayoutDashboard, Wallet, LogOut, CalendarDays, Users, Package, ShieldCheck, UserCircle, Sun, Moon } from "lucide-react";
import { alternarTema, temaAtual, type Tema } from "@/lib/tema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessao } from "@/lib/sessao";
import { projetosLocaisPendentes, importarLocaisParaNuvem } from "@/lib/storage";
import { PAPEIS, type Papel } from "@/lib/gestao";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeProjetos } from "@/hooks/useRealtimeProjetos";
import { useMeuNome } from "@/hooks/useMeuNome";
import { AvisosMedicao } from "@/components/AvisosMedicao";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const nome = useMeuNome();
  const { sair, papel, session } = useSessao();

  useEffect(() => { setPendentes(projetosLocaisPendentes()); }, []);

  const [medicoes, setMedicoes] = useState(0);
  const contarMedicoes = useCallback(async () => {
    if (papel === "serralheiro") return;
    // Toda ordem em "medicao" precisa da medição do Eduardo — inclusive as recém-aprovadas.
    const { count } = await supabase
      .from("projetos")
      .select("id", { count: "exact", head: true })
      .eq("etapa", "medicao");
    setMedicoes(count ?? 0);
  }, [papel]);
  useEffect(() => { void contarMedicoes(); }, [contarMedicoes]);
  useRealtimeProjetos(() => void contarMedicoes());

  const importar = async () => {
    try {
      const n = await importarLocaisParaNuvem();
      setPendentes(0);
      toast.success(`${n} orçamento(s) enviados para a sua conta`);
    } catch { toast.error("Não foi possível enviar os orçamentos"); }
  };

  const todos: { to: string; end: boolean; label: string; icon: typeof Users; papeis: Papel[] }[] = [
    { to: "/app", end: true, label: "Painel", icon: LayoutDashboard, papeis: ["gestor", "vendedora"] },
    { to: "/app/oficina", end: false, label: papel === "serralheiro" ? "Minhas ordens" : "Kanban", icon: Wrench, papeis: ["gestor", "vendedora", "serralheiro"] },
    { to: "/app/clientes", end: false, label: "Clientes", icon: Users, papeis: ["gestor", "vendedora"] },
    { to: "/app/projetos", end: false, label: "Orçamentos", icon: FolderKanban, papeis: ["gestor", "vendedora"] },
    { to: "/app/calendario", end: false, label: "Calendário", icon: CalendarDays, papeis: ["gestor", "vendedora"] },
    { to: "/app/materiais", end: false, label: "Materiais", icon: Package, papeis: ["gestor"] },
    { to: "/app/financeiro", end: false, label: "Financeiro", icon: Wallet, papeis: ["gestor"] },
    { to: "/app/equipe", end: false, label: "Equipe", icon: ShieldCheck, papeis: ["gestor"] },
    { to: "/app/configuracoes", end: false, label: "Empresa", icon: Building2, papeis: ["gestor"] },
  ];
  const navItems = todos.filter((it) => it.papeis.includes(papel));


  const papelNome = PAPEIS.find((p) => p.id === papel)?.nome ?? papel;

  const Navegacao = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        to="/app"
        onClick={() => mobile && setOpen(false)}
        className={cn(
          "flex items-center border-b border-sidebar-border",
          mobile ? "min-h-20 gap-3 px-4" : "min-h-24 flex-col justify-center gap-2 px-2",
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gradient-orange shadow-orange">
          <Wrench className="h-5 w-5 text-primary-foreground" />
        </span>
        <span className={cn("font-display text-sidebar-foreground", mobile ? "text-sm" : "text-[10px] text-center leading-tight")}>
          {mobile ? "Serralheiro Pro 3D" : <>Serralheiro<br />Pro 3D</>}
        </span>
      </Link>

      <nav className={cn("min-h-0 flex-1 overflow-y-auto py-3", mobile ? "space-y-1 px-3" : "space-y-1 px-2")} aria-label="Menu principal">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => mobile && setOpen(false)}
            title={!mobile ? it.label : undefined}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                mobile ? "items-center gap-3 rounded-md px-3 text-sm font-semibold" : "flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-[10px] font-semibold leading-none",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && !mobile && "before:absolute before:left-[-0.5rem] before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-sidebar-primary",
              )
            }
          >
            <span className="relative grid h-6 w-6 shrink-0 place-items-center">
              <it.icon className="h-5 w-5" />
              {it.to === "/app/oficina" && medicoes > 0 && (
                <span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground">{medicoes}</span>
              )}
            </span>
            <span className={cn(!mobile && "w-full truncate")}>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={cn("border-t border-sidebar-border", mobile ? "space-y-2 p-3" : "space-y-2 p-2")}>
        {nome && (
          <div className={cn("flex items-center rounded-md bg-sidebar-accent", mobile ? "gap-3 px-3 py-2" : "flex-col gap-1 px-1 py-2 text-center")} title={`${nome} · ${papelNome}`}>
            <UserCircle className="h-5 w-5 shrink-0 text-sidebar-primary" />
            <span className={cn("min-w-0", mobile ? "flex-1" : "w-full")}>
              <span className="block truncate text-xs font-semibold text-sidebar-foreground">{nome}</span>
              <span className="block truncate text-[9px] uppercase text-muted-foreground">{papelNome}</span>
            </span>
          </div>
        )}
        <Button variant="soft" size={mobile ? "sm" : "icon"} className={cn(mobile ? "w-full" : "w-full")} onClick={sair} title="Sair">
          <LogOut className="h-4 w-4" />
          {mobile && "Sair"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[5.5rem] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Navegacao />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <aside className="relative flex h-full w-72 max-w-[86vw] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
            <Button variant="soft" size="icon" className="absolute right-3 top-4 z-10" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </Button>
            <Navegacao mobile />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[5.5rem]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <Button variant="soft" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/app" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-orange">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="truncate font-display text-xs sm:text-sm">Serralheiro Pro 3D</span>
          </Link>
          <div className="flex items-center gap-2">
            {papel !== "serralheiro" && <AvisosMedicao mobile />}
            <Button variant="soft" size="icon" onClick={sair} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {papel !== "serralheiro" && (
          <div className="hidden justify-end border-b border-border bg-background/95 px-6 py-2 backdrop-blur lg:flex">
            <AvisosMedicao />
          </div>
        )}

        {pendentes > 0 && (
          <div className="border-b border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm lg:px-6">
              <span>{pendentes} orçamento(s) antigos estão salvos só neste aparelho.</span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={importar}>Enviar para minha conta</Button>
                <Button size="sm" variant="soft" onClick={() => setPendentes(0)}>Agora não</Button>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
