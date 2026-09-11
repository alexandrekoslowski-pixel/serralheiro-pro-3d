// Avisa quando qualquer ordem/orçamento muda no banco (tempo real).
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeProjetos(aoMudar: () => void): void {
  const ref = useRef(aoMudar);
  ref.current = aoMudar;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const disparar = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => ref.current(), 400);
    };

    const canal = supabase
      .channel(`projetos-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "projetos" }, disparar)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(canal);
    };
  }, []);
}
