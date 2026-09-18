// Função temporária: define uma senha provisória para as contas da serralheria.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const CHAVE = "kochinski-reset-2026";

Deno.serve(async (req) => {
  const { chave, senha, emails } = await req.json().catch(() => ({}));
  if (chave !== CHAVE) return new Response("nao autorizado", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: lista, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return new Response(error.message, { status: 500 });

  const resultado: Record<string, string> = {};
  for (const email of emails as string[]) {
    const user = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) { resultado[email] = "nao encontrado"; continue; }
    const { error: err } = await admin.auth.admin.updateUserById(user.id, {
      password: senha,
      email_confirm: true,
    });
    resultado[email] = err ? `erro: ${err.message}` : "ok";
  }

  return new Response(JSON.stringify(resultado), {
    headers: { "Content-Type": "application/json" },
  });
});
