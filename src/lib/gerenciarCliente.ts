import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Lista clientes de uma revenda específica (clientes que fizeram pedidos na revenda)
 * Se unidadeId for fornecido, filtra apenas clientes que fizeram pedidos naquela unidade
 */
export async function listarClientesRevenda(revendaId: string, unidadeId?: string | null): Promise<{ clientes: Array<{
  id: string
  nome_completo: string | null
  email: string
  telefone: string | null
  cpf: string | null
  total_pedidos: number
  valor_total_gasto: number
  ultimo_pedido: string | null
  inadimplente: boolean
  total_parcelas_atrasadas: number
  pedido_inadimplente_id?: string | null
}>; error: Error | null }> {
  try {
    // Busca pedidos da revenda para obter os clientes únicos
    let queryPedidos = supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        valor_total,
        criado_em,
        dados_cliente,
        forma_pagamento
      `)
      .eq('revenda_id', revendaId)
    
    // Filtra por unidade se fornecido
    if (unidadeId) {
      queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
    }
    
    const { data: pedidosData, error: pedidosError } = await queryPedidos
      .order('criado_em', { ascending: false })

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos da revenda:', pedidosError)
      return {
        clientes: [],
        error: pedidosError,
      }
    }

    // Agrupa por cliente_id e calcula estatísticas
    const clientesMap = new Map<string, {
      id: string
      nome_completo: string | null
      email: string
      telefone: string | null
      cpf: string | null
      total_pedidos: number
      valor_total_gasto: number
      ultimo_pedido: string | null
      inadimplente: boolean
      total_parcelas_atrasadas: number
    }>()

    pedidosData?.forEach((pedido: any) => {
      if (!pedido.cliente_id) return

      const clienteId = pedido.cliente_id
      const dadosCliente = pedido.dados_cliente || {}

      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          id: clienteId,
          nome_completo: dadosCliente.nome || null,
          email: dadosCliente.email || '',
          telefone: dadosCliente.telefone || null,
          cpf: dadosCliente.cpf || null,
          total_pedidos: 0,
          valor_total_gasto: 0,
          ultimo_pedido: null,
          inadimplente: false,
          total_parcelas_atrasadas: 0,
        })
      }

      const cliente = clientesMap.get(clienteId)!
      cliente.total_pedidos += 1
      cliente.valor_total_gasto += parseFloat(pedido.valor_total) || 0
      
      // Atualiza último pedido se for mais recente
      if (!cliente.ultimo_pedido || new Date(pedido.criado_em) > new Date(cliente.ultimo_pedido)) {
        cliente.ultimo_pedido = pedido.criado_em
      }

      // Atualiza dados do cliente se não tiver
      if (!cliente.nome_completo && dadosCliente.nome) {
        cliente.nome_completo = dadosCliente.nome
      }
      if (!cliente.email && dadosCliente.email) {
        cliente.email = dadosCliente.email
      }
      if (!cliente.telefone && dadosCliente.telefone) {
        cliente.telefone = dadosCliente.telefone
      }
      if (!cliente.cpf && dadosCliente.cpf) {
        cliente.cpf = dadosCliente.cpf
      }
    })

    // Busca dados completos dos clientes na tabela usuarios
    const clienteIds = Array.from(clientesMap.keys())
    if (clienteIds.length > 0) {
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email, telefone, cpf')
        .in('id', clienteIds)

      if (!usuariosError && usuariosData) {
        usuariosData.forEach((usuario: any) => {
          const cliente = clientesMap.get(usuario.id)
          if (cliente) {
            // Atualiza com dados mais completos da tabela usuarios
            cliente.nome_completo = usuario.nome_completo || cliente.nome_completo
            cliente.email = usuario.email || cliente.email
            cliente.telefone = usuario.telefone || cliente.telefone
            cliente.cpf = usuario.cpf || cliente.cpf
          }
        })
      }
    }

    // Verifica inadimplência para cada cliente
    const pedidosParceladosIds = pedidosData
      ?.filter((p: any) => p.forma_pagamento === 'pix_parcelado')
      .map((p: any) => p.id) || []

    if (pedidosParceladosIds.length > 0) {
      // Busca parcelamentos dos pedidos da revenda
      const { data: parcelamentosData } = await supabase
        .from('parcelamentos')
        .select('id, pedido_id')
        .in('pedido_id', pedidosParceladosIds)

      if (parcelamentosData && parcelamentosData.length > 0) {
        const parcelamentosIds = parcelamentosData.map(p => p.id)

        // Busca parcelas atrasadas agrupadas por pedido
        const { data: parcelasAtrasadas } = await supabase
          .from('parcelas')
          .select('id, parcelamento_id')
          .in('parcelamento_id', parcelamentosIds)
          .eq('status', 'atrasada')

        if (parcelasAtrasadas && parcelasAtrasadas.length > 0) {
          // Agrupa parcelas atrasadas por cliente e armazena o pedido relacionado
          const parcelasPorCliente = new Map<string, { total: number; pedido_id: string }>()

          parcelasAtrasadas.forEach((parcela: any) => {
            const parcelamento = parcelamentosData.find(p => p.id === parcela.parcelamento_id)
            if (!parcelamento) return

            const pedido = pedidosData?.find((p: any) => p.id === parcelamento.pedido_id)
            if (!pedido || !pedido.cliente_id) return

            const existing = parcelasPorCliente.get(pedido.cliente_id)
            if (existing) {
              existing.total += 1
            } else {
              parcelasPorCliente.set(pedido.cliente_id, { total: 1, pedido_id: pedido.id })
            }
          })

          // Atualiza status de inadimplência nos clientes
          parcelasPorCliente.forEach((data, clienteId) => {
            const cliente = clientesMap.get(clienteId)
            if (cliente) {
              cliente.inadimplente = true
              cliente.total_parcelas_atrasadas = data.total
              cliente.pedido_inadimplente_id = data.pedido_id
            }
          })
        }
      }
    }

    const clientes = Array.from(clientesMap.values()).sort((a, b) => {
      // Ordena por último pedido (mais recente primeiro)
      if (!a.ultimo_pedido) return 1
      if (!b.ultimo_pedido) return -1
      return new Date(b.ultimo_pedido).getTime() - new Date(a.ultimo_pedido).getTime()
    })

    return {
      clientes,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar clientes da revenda:', error)
    return {
      clientes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar clientes'),
    }
  }
}

/**
 * Atualiza dados de um cliente
 */
export async function atualizarCliente(
  clienteId: string,
  dados: {
    nome_completo?: string
    email?: string
    telefone?: string
    cpf?: string
  }
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('atualizar-usuario-admin', {
      body: {
        usuario_id: clienteId,
        ...dados,
      },
    })

    if (error) {
      console.error('❌ Erro ao atualizar cliente:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar cliente',
      }
    }

    if (data?.error) {
      return {
        error: new Error(data.error),
        mensagem: traduzirErro(data.error) || data.error,
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar cliente:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar cliente'),
      mensagem: 'Erro inesperado ao atualizar cliente',
    }
  }
}

/**
 * Exclui um cliente
 */
export async function excluirCliente(clienteId: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('excluir-usuario', {
      body: {
        userId: clienteId,
      },
    })

    if (error) {
      console.error('❌ Erro ao excluir cliente:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao excluir cliente',
      }
    }

    if (data?.error) {
      return {
        error: new Error(data.error),
        mensagem: traduzirErro(data.error) || data.error,
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao excluir cliente:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao excluir cliente'),
      mensagem: 'Erro inesperado ao excluir cliente',
    }
  }
}

/**
 * Bloqueia/desbloqueia um cliente
 */
export async function bloquearCliente(
  clienteId: string,
  tipo: 'horas' | 'dias' | 'permanente' | 'desbanir',
  quantidade?: number
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    let bannedUntil: string | null = null

    if (tipo === 'desbanir') {
      bannedUntil = null
    } else if (tipo === 'permanente') {
      // 100 anos no futuro
      const data = new Date()
      data.setFullYear(data.getFullYear() + 100)
      bannedUntil = data.toISOString()
    } else if (quantidade) {
      const data = new Date()
      if (tipo === 'horas') {
        data.setHours(data.getHours() + quantidade)
      } else if (tipo === 'dias') {
        data.setDate(data.getDate() + quantidade)
      }
      bannedUntil = data.toISOString()
    }

    const { data, error } = await supabase.functions.invoke('bloquear-usuario', {
      body: {
        usuario_id: clienteId,
        banned_until: bannedUntil,
      },
    })

    if (error) {
      console.error('❌ Erro ao bloquear cliente:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao bloquear cliente',
      }
    }

    if (data?.error) {
      return {
        error: new Error(data.error),
        mensagem: traduzirErro(data.error) || data.error,
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao bloquear cliente:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao bloquear cliente'),
      mensagem: 'Erro inesperado ao bloquear cliente',
    }
  }
}

/**
 * Envia magic link para um cliente
 */
export async function enviarMagicLinkCliente(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error('❌ Erro ao enviar magic link:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao enviar magic link',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao enviar magic link:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao enviar magic link'),
      mensagem: 'Erro inesperado ao enviar magic link',
    }
  }
}

/**
 * Envia email de redefinição de senha para um cliente
 */
export async function enviarRedefinicaoSenhaCliente(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) {
      console.error('❌ Erro ao enviar email de redefinição:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao enviar email de redefinição',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao enviar email de redefinição:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao enviar email de redefinição'),
      mensagem: 'Erro inesperado ao enviar email de redefinição',
    }
  }
}
