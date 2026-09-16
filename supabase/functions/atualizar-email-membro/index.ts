// Permite que o gestor troque o e-mail de acesso de alguém da equipe.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") ?? "";

    const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: userData } = await comoUsuario.auth.getUser();
    const solicitante = userData.user;
    if (!solicitante) return json({ erro: "nao_autenticado" }, 401);

    const { membro_id, email } = await req.json() as { membro_id?: string; email?: string };
    const novoEmail = (email ?? "").trim().toLowerCase();
    if (!membro_id || !novoEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(novoEmail)) {
      return json({ erro: "dados_invalidos" }, 400);
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { data: dono } = await admin.rpc("dono_atual", { _user_id: solicitante.id });
    const { data: papel } = await admin
      .from("user_roles").select("role").eq("user_id", solicitante.id).eq("role", "gestor").maybeSingle();
    if (!papel) return json({ erro: "sem_permissao" }, 403);

    const { data: alvo } = await admin
      .from("user_roles").select("user_id,dono_id").eq("id", membro_id).maybeSingle();
    if (!alvo || alvo.dono_id !== (dono ?? solicitante.id)) return json({ erro: "sem_permissao" }, 403);

    const { data: existente } = await admin.rpc("usuario_por_email", { _email: novoEmail });
    if (existente && existente !== alvo.user_id) return json({ erro: "email_em_uso" }, 409);

    const { error: erroAuth } = await admin.auth.admin.updateUserById(alvo.user_id, {
      email: novoEmail,
      email_confirm: true,
    });
    if (erroAuth) return json({ erro: "falha_auth", detalhe: erroAuth.message }, 400);

    await admin.from("profiles").update({ email: novoEmail }).eq("id", alvo.user_id);

    return json({ ok: true, email: novoEmail });
  } catch (e) {
    return json({ erro: "falha", detalhe: String(e) }, 500);
  }
});
