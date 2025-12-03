import { supabase } from '@/lib/supabase'

interface Usuario {
  id: string
  email: string
  nome_completo: string | null
  role: 'admin' | 'revenda' | 'cliente'
  created_at: string
  updated_at: string
}

export interface ClienteCompleto extends Usuario {
  telefone?: string | null
  cpf?: string | null
  display_name?: string | null
  email_confirmado?: boolean
  ultimo_login?: string | null
  telefone_confirmado?: boolean
  banido_at?: string | null
  banido_ate?: string | null
  esta_banido?: boolean
  inadimplente?: boolean
  total_parcelas_atrasadas?: number
  metadata?: Record<string, any>
}

/**
 * Lista todos os usuários (apenas para admin)
 */
export async function listarUsuarios(): Promise<{ usuarios: Usuario[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { usuarios: [], error }
    }

    return { usuarios: data || [], error: null }
  } catch (error) {
    return {
      usuarios: [],
      error: error instanceof Error ? error : new Error('Erro ao listar usuários'),
    }
  }
}

/**
 * Lista apenas revendas
 */
export async function listarRevendas(): Promise<{ revendas: Usuario[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'revenda')
      .order('created_at', { ascending: false })

    if (error) {
      return { revendas: [], error }
    }

    return { revendas: data || [], error: null }
  } catch (error) {
    return {
      revendas: [],
      error: error instanceof Error ? error : new Error('Erro ao listar revendas'),
    }
  }
}

/**
 * Lista apenas clientes com todos os detalhes
 * Busca informações da tabela usuarios e também de auth.users via RPC
 * @param revendaId Opcional - Se fornecido, filtra apenas clientes que têm pedidos dessa revenda
 */
export async function listarClientes(revendaId?: string, unidadeId?: string | null): Promise<{ clientes: ClienteCompleto[]; error: Error | null }> {
  try {
    console.log('🔍 Buscando clientes via RPC...', revendaId ? `(filtrado por revenda: ${revendaId}${unidadeId ? `, unidade: ${unidadeId}` : ''})` : '')
    
    // SEMPRE usa a função RPC - ela garante que apenas clientes sejam retornados
    const { data: clientesData, error: rpcError } = await supabase
      .rpc('buscar_detalhes_clientes')

    console.log('📊 Resultado RPC RAW:', { 
      temErro: !!rpcError, 
      erro: rpcError?.message,
      quantidade: clientesData?.length,
      dadosCompletos: clientesData,
      primeiroCliente: clientesData?.[0]
    })

    if (rpcError) {
      console.error('❌ Erro na RPC:', rpcError)
      return { 
        clientes: [], 
        error: rpcError instanceof Error ? rpcError : new Error('Erro ao buscar clientes via RPC')
      }
    }

    if (!clientesData || !Array.isArray(clientesData)) {
      console.warn('⚠️ Dados inválidos da RPC')
      return { clientes: [], error: null }
    }

    // Filtra APENAS clientes e mapeia os dados da RPC para o formato esperado
    let clientesCompletos: ClienteCompleto[] = clientesData
      .filter((cliente: any) => {
        if (!cliente || typeof cliente.role !== 'string') {
          console.warn('⚠️ Cliente inválido filtrado:', cliente)
          return false
        }
        const isCliente = cliente.role === 'cliente'
        if (!isCliente) {
          console.warn('⚠️ Role não é cliente:', cliente.role, cliente.email)
        }
        return isCliente
      })
      .map((cliente: any) => {
        const clienteMapeado = {
          id: cliente.id,
          email: cliente.email || '',  // Garante que sempre há um email
          nome_completo: cliente.nome_completo || null,
          role: 'cliente' as const,
          created_at: cliente.created_at,
          updated_at: cliente.updated_at,
          telefone: cliente.telefone || null,
          cpf: cliente.cpf || null,
          display_name: cliente.display_name || null,
          email_confirmado: cliente.email_confirmado || false,
          ultimo_login: cliente.ultimo_login || null,
          telefone_confirmado: cliente.telefone_confirmado || false,
          banido_at: cliente.banido_at || null,
          banido_ate: cliente.banido_ate || null,
          esta_banido: cliente.esta_banido || false,
          inadimplente: false,
          total_parcelas_atrasadas: 0,
          metadata: {
            telefone: cliente.telefone || null,
            cpf: cliente.cpf || null,
            display_name: cliente.display_name || null,
            nome_completo: cliente.nome_completo || null,
            banido_at: cliente.banido_at || null,
            banido_ate: cliente.banido_ate || null,
            esta_banido: cliente.esta_banido || false,
          },
        }
        
        console.log('📋 Cliente mapeado:', {
          id: clienteMapeado.id,
          email: clienteMapeado.email,
          nome_completo: clienteMapeado.nome_completo,
          display_name: clienteMapeado.display_name,
          telefone: clienteMapeado.telefone,
          cpf: clienteMapeado.cpf,
        })
        
        return clienteMapeado
      })

    // Se revendaId foi fornecido, filtra apenas clientes que têm pedidos dessa revenda
    if (revendaId) {
      let queryPedidos = supabase
        .from('pedidos')
        .select('cliente_id')
        .eq('revenda_id', revendaId)
      
      // Se unidadeId foi fornecido, filtra também por unidade
      if (unidadeId) {
        queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
      }
      
      const { data: pedidosRevenda } = await queryPedidos
      
      if (pedidosRevenda && pedidosRevenda.length > 0) {
        const clienteIdsComPedidos = new Set(pedidosRevenda.map((p: any) => p.cliente_id).filter(Boolean))
        clientesCompletos = clientesCompletos.filter(c => clienteIdsComPedidos.has(c.id))
      } else {
        // Se não há pedidos dessa revenda/unidade, retorna array vazio
        return { clientes: [], error: null }
      }
    }

    // Verifica inadimplência para cada cliente
    const clienteIds = clientesCompletos.map(c => c.id)
    
    if (clienteIds.length > 0) {
      // Busca pedidos parcelados dos clientes (filtrados por revenda e unidade se fornecidos)
      let pedidosQuery = supabase
        .from('pedidos')
        .select('id, cliente_id')
        .in('cliente_id', clienteIds)
        .eq('forma_pagamento', 'pix_parcelado')
      
      if (revendaId) {
        pedidosQuery = pedidosQuery.eq('revenda_id', revendaId)
      }
      
      if (unidadeId && revendaId) {
        pedidosQuery = pedidosQuery.eq('unidade_id', unidadeId)
      }
      
      const { data: pedidosData } = await pedidosQuery

      if (pedidosData && pedidosData.length > 0) {
        const pedidosIds = pedidosData.map(p => p.id)

        // Busca parcelamentos
        const { data: parcelamentosData } = await supabase
          .from('parcelamentos')
          .select('id, pedido_id')
          .in('pedido_id', pedidosIds)

        if (parcelamentosData && parcelamentosData.length > 0) {
          const parcelamentosIds = parcelamentosData.map(p => p.id)

          // Busca parcelas atrasadas agrupadas por cliente
          const { data: parcelasAtrasadas } = await supabase
            .from('parcelas')
            .select('id, parcelamento_id')
            .in('parcelamento_id', parcelamentosIds)
            .eq('status', 'atrasada')

          if (parcelasAtrasadas && parcelasAtrasadas.length > 0) {
            // Agrupa parcelas atrasadas por cliente
            const parcelasPorCliente = new Map<string, number>()

            parcelasAtrasadas.forEach((parcela: any) => {
              const parcelamento = parcelamentosData.find(p => p.id === parcela.parcelamento_id)
              if (!parcelamento) return

              const pedido = pedidosData.find((p: any) => p.id === parcelamento.pedido_id)
              if (!pedido || !pedido.cliente_id) return

              const count = parcelasPorCliente.get(pedido.cliente_id) || 0
              parcelasPorCliente.set(pedido.cliente_id, count + 1)
            })

            // Atualiza status de inadimplência nos clientes
            parcelasPorCliente.forEach((total, clienteId) => {
              const cliente = clientesCompletos.find(c => c.id === clienteId)
              if (cliente) {
                cliente.inadimplente = true
                cliente.total_parcelas_atrasadas = total
              }
            })
          }
        }
      }
    }

    console.log('✅ Clientes filtrados:', clientesCompletos.length)
    console.log('📋 Dados finais:', clientesCompletos.map(c => ({
      email: c.email,
      nome: c.display_name || c.nome_completo,
      telefone: c.telefone,
      inadimplente: c.inadimplente
    })))
    
    return { clientes: clientesCompletos, error: null }
  } catch (error) {
    console.error('❌ Erro ao listar clientes:', error)
    return {
      clientes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar clientes'),
    }
  }
}

/**
 * Busca detalhes completos de um cliente específico
 * Usa a função RPC para buscar dados completos
 */
export async function buscarDetalhesCliente(clienteId: string): Promise<{ cliente: ClienteCompleto | null; error: Error | null }> {
  try {
    // Busca todos os clientes via RPC e filtra pelo ID
    const { clientes, error } = await listarClientes()
    
    if (error) {
      return { cliente: null, error }
    }

    const cliente = clientes.find(c => c.id === clienteId)
    
    if (!cliente) {
      return { cliente: null, error: new Error('Cliente não encontrado') }
    }

    return { cliente, error: null }
  } catch (error) {
    return {
      cliente: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar detalhes do cliente'),
    }
  }
}

/**
 * Cria um novo usuário (requer Admin API via Edge Function)
 * Por enquanto, retorna erro informando que deve ser feito via Admin API
 */
export async function criarUsuarioAdmin(
  email: string,
  senha: string,
  nome: string,
  role: 'admin' | 'revenda' | 'cliente'
): Promise<{ error: Error | null; mensagem?: string }> {
  // Esta função deve ser implementada via Edge Function ou usar Admin API no backend
  // Por enquanto, retorna erro informando
  return {
    error: new Error('Esta funcionalidade requer Admin API. Use o painel do Supabase ou crie uma Edge Function.'),
    mensagem: 'Para criar usuários como admin, é necessário usar a Admin API do Supabase. Por favor, crie uma Edge Function ou use o painel do Supabase.',
  }
}

