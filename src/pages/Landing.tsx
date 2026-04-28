import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Box,
  Calculator,
  FileText,
  Layers,
  Package,
  Save,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { TIPOLOGIAS } from "@/lib/tipologias";

const features = [
  { icon: Calculator, title: "Cálculo automático", desc: "Materiais, mão de obra e margem em segundos." },
  { icon: Box, title: "3D em tempo real", desc: "Visualize o produto enquanto ajusta as medidas." },
  { icon: FileText, title: "Orçamento em PDF", desc: "Documento profissional com snapshot 3D e sua marca." },
  { icon: Layers, title: "Plano de corte", desc: "Nesting otimizado por barra com aproveitamento." },
  { icon: Package, title: "Catálogo próprio", desc: "Edite preços de perfis e acessórios à vontade." },
  { icon: Save, title: "Projetos salvos", desc: "Tudo no navegador. Funciona offline, sem login." },
];

export default function Landing() {
  return (
    <main className="min-h-screen hero-radial">
      {/* Header simples */}
      <header className="border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded bg-gradient-orange shadow-orange">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base">Serralheiro Pro 3D</span>
          </Link>
          <Button asChild className="bg-gradient-orange text-primary-foreground hover:opacity-90">
            <Link to="/app">Abrir o app</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Para serralheiros e metalúrgicos
        </span>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          Plano de corte, orçamento e
          <br />
          <span className="text-gradient-orange">3D em tempo real</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Calcule portões e esquadrias na frente do cliente. Ajuste medidas, veja o 3D, exporte um PDF profissional —
          tudo offline, sem cadastro.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-orange text-primary-foreground shadow-orange hover:opacity-90">
            <Link to="/app">
              Começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#features">Ver recursos</a>
          </Button>
        </div>

        {/* Pills de tipologias */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {TIPOLOGIAS.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-foreground/80"
            >
              {t.nome}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/30 py-16">
        <div className="container">
          <h2 className="font-display text-2xl sm:text-3xl">
            Tudo que <span className="text-gradient-orange">a oficina precisa</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface-card rounded-lg border border-border p-5">
                <div className="grid h-10 w-10 place-items-center rounded bg-gradient-orange shadow-orange">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-4 font-display text-base">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl">
          Pronto pra <span className="text-gradient-orange">fechar mais orçamentos</span>?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Comece grátis. Não precisa criar conta nem instalar nada.
        </p>
        <Button asChild size="lg" className="mt-6 bg-gradient-orange text-primary-foreground shadow-orange hover:opacity-90">
          <Link to="/app">
            Abrir o app <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Serralheiro Pro 3D — feito para a oficina.
      </footer>
    </main>
  );
}
