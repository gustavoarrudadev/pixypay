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
    // Validar variáveis de ambiente primeiro
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas')
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
      )
    }

    // Criar cliente Supabase Admin
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Aceitar ambos os formatos: userId ou usuario_id (compatibilidade)
    const body = await req.json()
    const userId = body.userId || body.usuario_id
    const bloquear = body.bloquear !== undefined ? body.bloquear : (body.banned_until ? true : false)
    const tempoBanimento = body.tempoBanimento
    
    // Se recebeu banned_until diretamente (formato antigo), converter para bloquear
    let bannedUntilReceived = body.banned_until

    console.log('🔒 Bloqueando/Desbloqueando usuário:', {
      userId,
      bloquear,
      tempoBanimento,
      bannedUntilReceived,
      bodyCompleto: JSON.stringify(body),
    })

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId ou usuario_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calcular data de expiração do banimento (banned_until)
    let banidoAte: Date | null = null
    
    // Se recebeu banned_until diretamente (formato antigo), usar ele
    if (bannedUntilReceived) {
      banidoAte = new Date(bannedUntilReceived)
      console.log('📅 Usando banned_until recebido:', bannedUntilReceived)
    } else if (bloquear) {
      if (tempoBanimento === 'permanente') {
        // Banimento permanente: 100 anos no futuro
        banidoAte = new Date()
        banidoAte.setFullYear(banidoAte.getFullYear() + 100)
      } else if (tempoBanimento) {
        // Verificar se é horas ou dias
        if (tempoBanimento.endsWith('h')) {
          // Banimento em horas (ex: '1h', '6h', '12h', '24h')
          const horas = parseInt(tempoBanimento.replace('h', '')) || 1
          banidoAte = new Date()
          banidoAte.setHours(banidoAte.getHours() + horas)
          console.log(`📅 Banimento: ${horas} hora(s)`)
        } else if (tempoBanimento.endsWith('d')) {
          // Banimento em dias (ex: '1d', '7d', '30d')
          const dias = parseInt(tempoBanimento.replace('d', '')) || 1
          banidoAte = new Date()
          banidoAte.setDate(banidoAte.getDate() + dias)
          console.log(`📅 Banimento: ${dias} dia(s)`)
        } else {
          // Banimento em dias sem formato (ex: '1', '7', '30')
          const dias = parseInt(tempoBanimento) || 1
          banidoAte = new Date()
          banidoAte.setDate(banidoAte.getDate() + dias)
          console.log(`📅 Banimento: ${dias} dia(s)`)
        }
      } else {
        // Padrão: 1 dia se não especificado
        banidoAte = new Date()
        banidoAte.setDate(banidoAte.getDate() + 1)
      }
    }

    // Buscar usuário atual ANTES da atualização
    const { data: userBeforeData, error: getUserBeforeError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, banned_until')
      .eq('id', userId)
      .single()
    
    if (getUserBeforeError) {
      console.error('❌ Erro ao buscar usuário:', getUserBeforeError)
    }
    
    console.log('👤 Estado atual do usuário:', {
      id: userBeforeData?.id,
      email: userBeforeData?.email,
      banned_until: userBeforeData?.banned_until,
    })

    // ⚠️ CRÍTICO: Usar SQL direto para atualizar auth.users
    // A Admin SDK não suporta bem o campo banned_until
    let authError: any = null
    let bannedUntilFinal: string | null = null

    if (bloquear) {
      // Para BANIR: definir banned_until com data futura
      bannedUntilFinal = banidoAte?.toISOString() || null
      
      const { error } = await supabaseAdmin.rpc('update_user_banned_until', {
        user_id: userId,
        banned_until_value: bannedUntilFinal
      })
      
      authError = error
      
      // Se o RPC não existe, usar UPDATE direto
      if (authError && authError.message?.includes('function') && authError.message?.includes('does not exist')) {
        console.log('⚠️ RPC não existe, usando UPDATE direto')
        const { error: updateError } = await supabaseAdmin
          .from('auth.users')
          .update({ banned_until: bannedUntilFinal })
          .eq('id', userId)
        
        authError = updateError
      }
      
      console.log('🔒 Aplicando banimento:', { 
        banned_until: bannedUntilFinal,
        tempo_original: tempoBanimento
      })
    } else {
      // Para DESBANIR: definir banned_until como NULL
      bannedUntilFinal = null
      
      const { error } = await supabaseAdmin.rpc('update_user_banned_until', {
        user_id: userId,
        banned_until_value: null
      })
      
      authError = error
      
      // Se o RPC não existe, usar UPDATE direto
      if (authError && authError.message?.includes('function') && authError.message?.includes('does not exist')) {
        console.log('⚠️ RPC não existe, usando UPDATE direto')
        const { error: updateError } = await supabaseAdmin
          .from('auth.users')
          .update({ banned_until: null })
          .eq('id', userId)
        
        authError = updateError
      }
      
      console.log('🔓 Removendo banimento')
    }

    if (authError) {
      console.error('❌ Erro ao atualizar banimento no Supabase Auth:', authError)
      return new Response(
        JSON.stringify({ 
          error: authError.message || 'Erro ao atualizar banimento',
          details: JSON.stringify(authError)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verificar se foi atualizado corretamente
    const { data: userAfterData, error: getUserAfterError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, banned_until')
      .eq('id', userId)
      .single()

    console.log('✅ Banimento atualizado no Auth:', {
      banned_until_antes: userBeforeData?.banned_until,
      banned_until_depois: userAfterData?.banned_until,
    })

    // Atualizar campos de banimento na tabela usuarios (cache)
    const updateData: any = {}
    
    if (bloquear) {
      updateData.banido_at = new Date().toISOString()
      updateData.banido_ate = banidoAte?.toISOString() || null
    } else {
      // Desbanir: limpar campos de banimento
      updateData.banido_at = null
      updateData.banido_ate = null
    }

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)

    if (dbError) {
      console.error('❌ Erro ao atualizar banimento na tabela usuarios:', dbError)
      return new Response(
        JSON.stringify({ error: dbError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verificar se está banido: banned_until existe e ainda não passou
    const estaBanido = userAfterData?.banned_until && 
                       new Date(userAfterData.banned_until) > new Date()

    console.log('✅ Usuário atualizado com sucesso:', {
      userId,
      bloquear,
      esta_banido: estaBanido,
      authAtualizado: true,
      tabelaAtualizada: true
    })

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        userId,
        bloquear,
        banidoAte: banidoAte?.toISOString() || null,
        banned_until: userAfterData?.banned_until || null,
        esta_banido: estaBanido,
        auth_updated: true,
        table_updated: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
