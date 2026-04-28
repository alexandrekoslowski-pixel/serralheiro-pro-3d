// Wrapper lazy do visualizador 3D — evita carregamento desnecessário.
import { lazy, Suspense } from "react";
import type { Visualizador3DProps } from "./Visualizador3D";

const Visualizador3D = lazy(() => import("./Visualizador3D"));

export default function Visualizador3DClient(props: Visualizador3DProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
          Carregando visualização 3D…
        </div>
      }
    >
      <Visualizador3D {...props} />
    </Suspense>
  );
}
