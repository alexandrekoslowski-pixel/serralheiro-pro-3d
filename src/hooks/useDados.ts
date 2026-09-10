// Re-renderiza quando o cache de dados muda.
import { useEffect, useState } from "react";
import { assinarDados } from "@/lib/storage";

export function useDados(): number {
  const [v, setV] = useState(0);
  useEffect(() => assinarDados(() => setV((n) => n + 1)), []);
  return v;
}
