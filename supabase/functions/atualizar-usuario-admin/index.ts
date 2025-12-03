import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do body:', parseError)
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar requisição',
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Aceitar ambos os formatos: userId ou usuario_id (compatibilidade)
    const userId = body.userId || body.usuario_id || body.user_id
    const { email, password, nome_completo, display_name, telefone, cpf } = body

    console.log('📝 Atualizando usuário:', {
      userId,
      email,
      temSenha: !!password,
      nome_completo,
      display_name,
      telefone,
      cpf,
      bodyCompleto: JSON.stringify(body),
    })

    if (!userId) {
      console.error('❌ userId não fornecido')
      return new Response(
        JSON.stringify({
          error: 'userId, usuario_id ou user_id é obrigatório',
          receivedBody: body,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return new Response(
        JSON.stringify({
          error: 'Configuração do servidor incompleta. Variáveis de ambiente não configuradas.',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Buscar usuário atual primeiro para garantir que existe
    let currentUser;
    try {
      const getUserResult = await supabaseAdmin.auth.admin.getUserById(userId);
      currentUser = getUserResult.data;
      
      if (getUserResult.error) {
        console.error('❌ Erro ao buscar usuário:', getUserResult.error);
        return new Response(
          JSON.stringify({
            error: 'Erro ao buscar usuário',
            details: getUserResult.error.message || JSON.stringify(getUserResult.error),
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (!currentUser?.user) {
        console.error('❌ Usuário não encontrado');
        return new Response(
          JSON.stringify({
            error: 'Usuário não encontrado',
            details: 'Usuário não existe no sistema de autenticação',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (getUserException) {
      console.error('❌ Exceção ao buscar usuário:', getUserException);
      return new Response(
        JSON.stringify({
          error: 'Erro ao buscar usuário',
          details: getUserException instanceof Error ? getUserException.message : String(getUserException),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};

    // Atualizar email se fornecido
    if (email) {
      updateData.email = email;
    }

    // NOTA: Não atualizar senha via updateUserById aqui
    // A senha será atualizada via RPC para garantir que funcione corretamente

    // Atualizar user_metadata
    const userMetadata: any = {};
    if (nome_completo) {
      userMetadata.nome_completo = nome_completo;
      userMetadata.display_name = display_name || nome_completo;
    }
    if (display_name) {
      userMetadata.display_name = display_name;
    }
    if (telefone !== undefined) {
      userMetadata.telefone = telefone;
    }
    if (cpf !== undefined) {
      userMetadata.cpf = cpf;
    }

    if (Object.keys(userMetadata).length > 0) {
      updateData.user_metadata = userMetadata;
    }

    // Só atualizar via updateUserById se houver dados para atualizar (além da senha)
    let userData = { user: currentUser.user };
    if (Object.keys(updateData).length > 0) {
      console.log('🔄 Dados de atualização:', {
        ...updateData,
        password: updateData.password ? '***' : undefined,
      });

      const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário no auth.users:', updateError);
        return new Response(
          JSON.stringify({
            error: updateError.message || 'Erro ao atualizar usuário',
            details: updateError,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!updatedUserData?.user) {
        console.error('❌ Usuário não foi retornado após atualização');
        return new Response(
          JSON.stringify({ error: 'Usuário não foi atualizado no sistema de autenticação' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      userData = updatedUserData;
      console.log('✅ Usuário atualizado com sucesso:', userData.user.id);
    } else {
      console.log('ℹ️ Nenhum dado adicional para atualizar (apenas senha)');
    }

    // Se atualizou senha, usar RPC para atualizar diretamente no banco
    if (password) {
      try {
        console.log('🔄 Atualizando senha via RPC...');
        const { error: passwordRpcError } = await supabaseAdmin.rpc('update_user_password', {
          p_user_id: userId,
          p_password: password,
        });
        
        if (passwordRpcError) {
          console.error('❌ Erro ao atualizar senha via RPC:', passwordRpcError);
          return new Response(
            JSON.stringify({
              error: 'Erro ao atualizar senha',
              details: passwordRpcError.message || passwordRpcError,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          console.log('✅ Senha atualizada com sucesso via RPC');
        }

        // Garantir que email continue confirmado após atualizar senha
        const { error: rpcError } = await supabaseAdmin.rpc('update_email_confirmed_at', {
          p_user_id: userId,
          p_email_confirmed_at: new Date().toISOString(),
        });
        
        if (rpcError) {
          console.error('⚠️ Erro ao atualizar email_confirmed_at (não crítico):', rpcError);
          // Não falha a operação se apenas isso der erro
        } else {
          console.log('✅ email_confirmed_at atualizado com sucesso');
        }
      } catch (rpcError) {
        console.error('❌ Erro ao chamar RPCs de atualização de senha:', rpcError);
        return new Response(
          JSON.stringify({
            error: 'Erro ao atualizar senha',
            details: rpcError instanceof Error ? rpcError.message : String(rpcError),
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Atualizar tabela usuarios se necessário
    if (email || nome_completo || telefone !== undefined || cpf !== undefined) {
      const usuarioUpdate: any = {};
      if (email) {
        usuarioUpdate.email = email;
      }
      if (nome_completo) {
        usuarioUpdate.nome_completo = nome_completo;
      }
      if (telefone !== undefined) {
        usuarioUpdate.telefone = telefone;
      }
      if (cpf !== undefined) {
        usuarioUpdate.cpf = cpf;
      }

      const { error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .update(usuarioUpdate)
        .eq('id', userId);

      if (usuarioError) {
        console.error('❌ Erro ao atualizar registro em usuarios:', usuarioError);
        // Não falha a operação se apenas a tabela usuarios não puder ser atualizada
        // O trigger handle_new_user deve sincronizar automaticamente
      } else {
        console.log('✅ Registro atualizado na tabela usuarios');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role: userData.user.user_metadata?.role,
          display_name: userData.user.user_metadata?.display_name,
          telefone: userData.user.user_metadata?.telefone,
          cpf: userData.user.user_metadata?.cpf,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro inesperado na Edge Function:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro inesperado ao atualizar usuário',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

