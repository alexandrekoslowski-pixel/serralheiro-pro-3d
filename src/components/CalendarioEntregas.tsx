// Calendário de entregas reutilizável (widget sem wrapper de página).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDados } from "@/hooks/useDados";
import { listarProjetos, obterEmpresa, formatarBRL, ProjetoLocal } from "@/lib/storage";
import { corPrazo, CLASSES_PRAZO, STATUS_LABEL } from "@/lib/ordens";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CalendarioEntregas() {
  useDados();
  const projetos = listarProjetos();
  const empresa = obterEmpresa();
  const hoje = new Date();
  const [ref, setRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const porDia = useMemo(() => {
    const m = new Map<string, ProjetoLocal[]>();
    for (const p of projetos) {
      if (!p.prazo_entrega) continue;
      const lista = m.get(p.prazo_entrega) ?? [];
      lista.push(p);
      m.set(p.prazo_entrega, lista);
    }
    return m;
  }, [projetos]);

  const celulas = useMemo(() => {
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, [ref]);

  const selecionadas = diaSel ? porDia.get(diaSel) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg md:text-xl">Calendário de entregas</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-36 text-center font-display capitalize text-sm">
            {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}>Hoje</Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {DIAS.map((d) => (
          <div key={d} className="bg-card px-2 py-1.5 text-center text-[11px] uppercase text-muted-foreground">{d}</div>
        ))}
        {celulas.map((d) => {
          const chave = iso(d);
          const doDia = porDia.get(chave) ?? [];
          const foraDoMes = d.getMonth() !== ref.getMonth();
          const ehHoje = chave === iso(hoje);
          return (
            <button
              key={chave}
              onClick={() => setDiaSel(doDia.length ? chave : null)}
              className={`min-h-20 bg-background p-1.5 text-left align-top transition hover:bg-card ${foraDoMes ? "opacity-40" : ""}`}
            >
              <div className={`mb-1 text-xs ${ehHoje ? "inline-grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {d.getDate()}
              </div>
              <div className="space-y-1">
                {doDia.slice(0, 3).map((p) => {
                  const cls = CLASSES_PRAZO[corPrazo(p, empresa)];
                  return (
                    <div key={p.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${cls.badge}`}>
                      {p.cliente || p.nome}
                    </div>
                  );
                })}
                {doDia.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{doDia.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {diaSel && (
        <div className="mt-4 space-y-2">
          <h3 className="font-display text-base">
            Entregas de {new Date(diaSel + "T00:00:00").toLocaleDateString("pt-BR")}
          </h3>
          {selecionadas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma entrega neste dia.</p>
          )}
          {selecionadas.map((p) => (
            <Link
              key={p.id}
              to={`/app/projeto/${p.id}`}
              className="surface-card flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary"
            >
              <span>
                <strong>{p.cliente || "Sem cliente"}</strong> · {p.nome}
              </span>
              <span className="text-muted-foreground">
                {STATUS_LABEL[p.status]} · {formatarBRL(p.total)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
