import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    // Verify caller via getUser (more reliable than getClaims)
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    // Verify caller is admin
    const { data: roleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    const roles = (roleRows || []).map((r: any) => r.role);
    if (!roles.some((r: string) => ["admin", "super_admin"].includes(r))) {
      console.error("Permission denied for user:", callerId, "roles:", roles);
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, target_user_id, unit_id, target_unit_id } = await req.json();

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-action
    if (target_user_id === callerId) {
      return new Response(JSON.stringify({ error: "Não é possível executar esta ação em si mesmo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove_from_unit") {
      if (!unit_id) {
        return new Response(JSON.stringify({ error: "unit_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient
        .from("user_units")
        .delete()
        .eq("user_id", target_user_id)
        .eq("unit_id", unit_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "transfer_to_unit") {
      if (!unit_id || !target_unit_id) {
        return new Response(JSON.stringify({ error: "unit_id e target_unit_id são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get current role in source unit
      const { data: currentAssignment } = await adminClient
        .from("user_units")
        .select("role")
        .eq("user_id", target_user_id)
        .eq("unit_id", unit_id)
        .single();

      const userRole = currentAssignment?.role || "member";

      // Remove from current unit
      await adminClient
        .from("user_units")
        .delete()
        .eq("user_id", target_user_id)
        .eq("unit_id", unit_id);

      // Check if already in target unit
      const { data: existing } = await adminClient
        .from("user_units")
        .select("id")
        .eq("user_id", target_user_id)
        .eq("unit_id", target_unit_id)
        .maybeSingle();

      if (!existing) {
        const { error } = await adminClient
          .from("user_units")
          .insert({
            user_id: target_user_id,
            unit_id: target_unit_id,
            role: userRole,
            is_default: true,
          });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_account") {
      // Delete user completely
      await adminClient.from("user_units").delete().eq("user_id", target_user_id);
      await adminClient.from("user_roles").delete().eq("user_id", target_user_id);
      await adminClient.from("profiles").delete().eq("user_id", target_user_id);

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
