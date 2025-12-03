import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (req)=>{
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError);
      return new Response(JSON.stringify({
        error: "Erro ao processar requisição. Body inválido.",
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const { email, password, nome_completo, role, telefone, cpf, enviar_magic_link, email_confirmado, revenda_id } = body;
    
    console.log("📝 Criando usuário:", {
      email,
      role,
      telefone,
      cpf,
      enviar_magic_link,
      email_confirmado,
      temSenha: !!password,
      bodyCompleto: JSON.stringify(body)
    });

    // Validação básica
    if (!email || !nome_completo || !role) {
      console.error("❌ Campos obrigatórios faltando:", {
        temEmail: !!email,
        temNomeCompleto: !!nome_completo,
        temRole: !!role,
        body: JSON.stringify(body)
      });
      return new Response(JSON.stringify({
        error: "Campos obrigatórios: email, nome_completo, role",
        received: {
          email: !!email,
          nome_completo: !!nome_completo,
          role: !!role
        }
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // Configuração do Supabase Admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const appUrl = Deno.env.get("VITE_APP_URL") || Deno.env.get("APP_URL") || "http://localhost:5173";
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis de ambiente não configuradas", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return new Response(JSON.stringify({
        error: "Configuração do servidor incompleta. Variáveis de ambiente não configuradas.",
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // Cria o cliente admin do Supabase
    const { createClient } = await import("jsr:@supabase/supabase-js@2");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Prepara user_metadata (apenas campos definidos)
    const userMetadata: any = {
      nome_completo: nome_completo.trim(),
      role,
      display_name: nome_completo.trim()
    };
    
    // Adiciona telefone e CPF apenas se fornecidos e não vazios
    if (telefone && telefone.trim() !== '') {
      userMetadata.telefone = telefone.trim();
    }
    if (cpf && cpf.trim() !== '') {
      // Remove caracteres não numéricos do CPF
      userMetadata.cpf = cpf.replace(/\D/g, '');
    }
    // Adiciona revenda_id se fornecido (para colaboradores revenda)
    if (revenda_id) {
      userMetadata.revenda_id = revenda_id;
    }

    console.log("📋 User metadata preparado:", {
      ...userMetadata,
      cpf: userMetadata.cpf ? '***' : undefined
    });
    let userData;
    let createError;
    if (enviar_magic_link) {
      // Se for magic link, usa inviteUserByEmail que envia email automaticamente
      console.log("🔄 Enviando convite (magic link) para:", email);
      const result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: userMetadata,
        redirectTo: `${appUrl}/magic-link-login`
      });
      userData = result.data;
      createError = result.error;
      if (!createError) {
        console.log("✅ Convite enviado com sucesso:", userData?.user?.id);
      }
    } else if (!password) {
      // Se não for magic link e não tiver senha, usa inviteUserByEmail
      // Isso cria o usuário e envia email para criar senha
      console.log("🔄 Criando usuário e enviando email para criar senha:", email);
      const result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: userMetadata,
        redirectTo: `${appUrl}/redefinir-senha`
      });
      userData = result.data;
      createError = result.error;
      if (!createError) {
        console.log("✅ Usuário criado e email de criação de senha enviado:", userData?.user?.id);
      }
    } else {
      // Se forneceu senha, cria usuário com senha
      // Para colaboradores, email deve ser confirmado automaticamente
      const shouldConfirmEmail = email_confirmado === true || role === 'colaborador_revenda';
      const createUserOptions = {
        email,
        password,
        email_confirm: shouldConfirmEmail,
        user_metadata: userMetadata
      };
      console.log("🔄 Criando usuário com senha:", {
        ...createUserOptions,
        password: "***",
        email_confirm: shouldConfirmEmail
      });
      const result = await supabaseAdmin.auth.admin.createUser(createUserOptions);
      userData = result.data;
      createError = result.error;
      if (!createError && userData?.user) {
        console.log("✅ Usuário criado com sucesso:", userData.user.id);
        if (shouldConfirmEmail) {
          console.log("✅ Email confirmado automaticamente para colaborador");
        } else {
          console.log("📧 Email de confirmação deve ser enviado pelo front-end");
        }
      }
    }
    if (createError) {
      console.error("❌ Erro ao criar usuário:", createError);
      console.error("❌ Detalhes do erro:", JSON.stringify(createError, null, 2));
      
      // Mensagem de erro mais detalhada
      let errorMessage = createError.message || "Erro ao criar usuário";
      
      // Mensagens específicas para erros comuns
      if (createError.message?.includes("already registered") || createError.message?.includes("already exists")) {
        errorMessage = "Este e-mail já está cadastrado no sistema";
      } else if (createError.message?.includes("invalid email")) {
        errorMessage = "E-mail inválido. Verifique o formato do e-mail";
      } else if (createError.message?.includes("password")) {
        errorMessage = "Erro na senha. Verifique se a senha atende aos requisitos mínimos";
      }
      
      return new Response(JSON.stringify({
        error: errorMessage,
        details: createError.message,
        code: createError.status || createError.code
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Verificar se userData e user existem
    if (!userData || !userData.user || !userData.user.id) {
      console.error("❌ userData inválido:", userData);
      return new Response(JSON.stringify({
        error: "Usuário não foi criado corretamente"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // O trigger handle_new_user() cria automaticamente o registro em usuarios
    // Mas vamos garantir que o registro existe antes de retornar
    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se o registro foi criado pelo trigger
    const { data: usuarioData, error: usuarioCheckError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, role')
      .eq('id', userData.user.id)
      .single();

    if (usuarioCheckError || !usuarioData) {
      console.warn("⚠️ Registro não encontrado em usuarios, tentando criar manualmente...");
      // Se o trigger não criou, tentar criar manualmente
      const { error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: userData.user.id,
          email: userData.user.email || email,
          nome_completo: nome_completo || '',
          role: role,
        })
        .select()
        .single();

      if (usuarioError) {
        console.error("❌ Erro ao criar registro em usuarios:", usuarioError);
        console.error("❌ Detalhes do erro:", JSON.stringify(usuarioError));
        // Tentar deletar o usuário criado no auth para manter consistência
        try {
          await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        } catch (deleteError) {
          console.error("❌ Erro ao deletar usuário após falha:", deleteError);
        }
        
        return new Response(JSON.stringify({ 
          error: "Erro ao criar registro do usuário",
          details: usuarioError.message || JSON.stringify(usuarioError)
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      console.log("✅ Registro criado manualmente na tabela usuarios");
    } else {
      console.log("✅ Registro já existe na tabela usuarios (criado pelo trigger)");
    }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email || email,
        role: userData.user.user_metadata?.role || role,
        display_name: userData.user.user_metadata?.display_name || nome_completo,
        telefone: userData.user.user_metadata?.telefone,
        cpf: userData.user.user_metadata?.cpf
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
