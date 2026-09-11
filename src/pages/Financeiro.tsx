import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useDados } from "@/hooks/useDados";
import { listarProjetos, listarPagamentos, formatarBRL, obterEmpresa } from "@/lib/storage";
import { STATUS_LABEL, corPrazo, CLASSES_PRAZO, textoPrazo } from "@/lib/ordens";

const mesDe = (iso: string) => iso.slice(0, 7);
const rotuloMes = (m: string) => {
  const [a, mm] = m.split("-");
  return new Date(Number(a), Number(mm) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
};

export default function Financeiro() {
  useDados();
  const todosProjetos = listarProjetos();
  const empresa = obterEmpresa();
  const [vendFiltro, setVendFiltro] = useState("todas");

  const nomesVendedoras = useMemo(() => {
    const set = new Set<string>((empresa.vendedoras ?? []).filter(Boolean));
    todosProjetos.forEach((p) => { if (p.vendedora) set.add(p.vendedora); });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [todosProjetos, empresa]);

  const projetos = useMemo(() => todosProjetos.filter((p) =>
    vendFiltro === "todas" ? true :
    vendFiltro === "__sem__" ? !p.vendedora :
    p.vendedora === vendFiltro
  ), [todosProjetos, vendFiltro]);

  const idsFiltro = useMemo(() => new Set(projetos.map((p) => p.id)), [projetos]);
  const pagamentos = listarPagamentos().filter((x) => idsFiltro.has(x.projeto_id));

  const porVendedora = useMemo(() => {
    const mapa = new Map<string, { orcado: number; faturado: number; recebido: number; qtd: number }>();
    todosProjetos.forEach((p) => {
      const k = p.vendedora || "Sem vendedora";
      if (!mapa.has(k)) mapa.set(k, { orcado: 0, faturado: 0, recebido: 0, qtd: 0 });
      const v = mapa.get(k)!;
      v.orcado += p.total;
      v.faturado += p.valor_faturado || 0;
      v.recebido += listarPagamentos(p.id).reduce((s, x) => s + x.valor, 0);
      v.qtd += 1;
    });
    return [...mapa.entries()].sort((a, b) => b[1].faturado - a[1].faturado);
  }, [todosProjetos]);

  const meses = useMemo(() => {
    const mapa = new Map<string, { orcado: number; faturado: number; recebido: number }>();
    const get = (m: string) => {
      if (!mapa.has(m)) mapa.set(m, { orcado: 0, faturado: 0, recebido: 0 });
      return mapa.get(m)!;
    };
    projetos.forEach((p) => {
      get(mesDe(p.created_at)).orcado += p.total;
      if (p.valor_faturado) get(mesDe(p.faturado_em ?? p.updated_at)).faturado += p.valor_faturado;
    });
    pagamentos.forEach((p) => { get(mesDe(p.data)).recebido += p.valor; });
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [projetos, pagamentos]);

  const aReceber = useMemo(
    () => projetos
      .map((p) => ({ p, saldo: (p.valor_faturado || 0) - listarPagamentos(p.id).reduce((s, x) => s + x.valor, 0) }))
      .filter((x) => x.saldo > 0.01)
      .sort((a, b) => b.saldo - a.saldo),
    [projetos, pagamentos],
  );

  const totalGeral = meses.reduce(
    (acc, [, v]) => ({ orcado: acc.orcado + v.orcado, faturado: acc.faturado + v.faturado, recebido: acc.recebido + v.recebido }),
    { orcado: 0, faturado: 0, recebido: 0 },
  );
  const maior = Math.max(1, ...meses.map(([, v]) => Math.max(v.orcado, v.faturado, v.recebido)));

  const exportarCSV = () => {
    const linhas = [
      ["Ordem", "Cliente", "Vendedora", "Situação", "Prazo", "Orçado", "Faturado", "Recebido", "Em aberto"].join(";"),
      ...projetos.map((p) => {
        const rec = listarPagamentos(p.id).reduce((s, x) => s + x.valor, 0);
        return [
          p.nome, p.cliente, p.vendedora || "", STATUS_LABEL[p.status], p.prazo_entrega ?? "",
          p.total.toFixed(2), (p.valor_faturado || 0).toFixed(2), rec.toFixed(2),
          ((p.valor_faturado || 0) - rec).toFixed(2),
        ].join(";");
      }),
    ].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + linhas], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "financeiro.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="container py-6 md:py-10 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Quanto foi orçado, quanto foi faturado e quanto entrou.</p>
        </div>
        <div className="flex gap-2">
          <Select value={vendFiltro} onValueChange={setVendFiltro}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Vendedora" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as vendedoras</SelectItem>
              <SelectItem value="__sem__">Sem vendedora</SelectItem>
              {nomesVendedoras.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCSV}><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Orçado", v: totalGeral.orcado },
          { l: "Faturado", v: totalGeral.faturado },
          { l: "Recebido", v: totalGeral.recebido },
          { l: "A receber", v: totalGeral.faturado - totalGeral.recebido },
        ].map((c) => (
          <div key={c.l} className="surface-card rounded-lg border border-border p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.l}</div>
            <div className="font-display text-lg md:text-xl">{formatarBRL(c.v)}</div>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg mb-4">Por vendedora</h2>
        {porVendedora.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há orçamentos.</p>}
        <div className="space-y-2">
          {porVendedora.map(([nome, v]) => (
            <div key={nome} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm">
              <span className="font-medium">{nome} <span className="text-xs text-muted-foreground">· {v.qtd} orçamento(s)</span></span>
              <span className="text-xs text-muted-foreground">
                Orçado {formatarBRL(v.orcado)} · Faturado {formatarBRL(v.faturado)} · Recebido {formatarBRL(v.recebido)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg mb-4">Mês a mês</h2>
        {meses.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há movimento.</p>}
        <div className="space-y-4">
          {meses.map(([m, v]) => (
            <div key={m}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{rotuloMes(m)}</span>
                <span className="text-xs text-muted-foreground">
                  Orçado {formatarBRL(v.orcado)} · Faturado {formatarBRL(v.faturado)} · Recebido {formatarBRL(v.recebido)}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {([["Orçado", v.orcado, "bg-muted-foreground/40"], ["Faturado", v.faturado, "bg-primary"], ["Recebido", v.recebido, "bg-emerald-500"]] as const).map(([l, val, cls]) => (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-16 text-[10px] uppercase text-muted-foreground">{l}</span>
                    <div className="h-2 flex-1 rounded bg-card">
                      <div className={`h-2 rounded ${cls}`} style={{ width: `${(val / maior) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg mb-4">Contas a receber</h2>
        {aReceber.length === 0 && <p className="text-sm text-muted-foreground">Nada em aberto.</p>}
        <div className="space-y-2">
          {aReceber.map(({ p, saldo }) => {
            const cls = CLASSES_PRAZO[corPrazo(p, empresa)];
            return (
              <Link key={p.id} to={`/app/projeto/${p.id}`} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm hover:border-primary/50">
                <span className="min-w-0">
                  <span className="font-medium">{p.nome}</span>
                  <span className="block text-xs text-muted-foreground">{p.cliente || "Sem cliente"} · <span className={cls.texto}>{textoPrazo(p)}</span></span>
                </span>
                <strong className="shrink-0">{formatarBRL(saldo)}</strong>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
