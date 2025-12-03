import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Parse do body com tratamento de erro
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar requisição. Body inválido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Aceita tanto userId quanto usuario_id para compatibilidade
    const userId = body.userId || body.usuario_id

    console.log('🗑️ Excluindo usuário:', { userId, body })

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'userId é obrigatório',
          received: body 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Excluir usuário do auth.users
    // Isso também excluirá automaticamente os registros relacionados devido ao ON DELETE CASCADE
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('❌ Erro ao excluir usuário:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: deleteError.message || 'Erro ao excluir usuário',
          details: deleteError 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Usuário excluído com sucesso:', userId)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário excluído com sucesso'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Erro inesperado ao excluir usuário:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro inesperado ao excluir usuário',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})


