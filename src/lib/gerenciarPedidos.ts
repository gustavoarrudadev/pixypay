import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { criarTransacaoFinanceira } from './financeiro'
import { buscarConfiguracaoRepasseAtiva } from './configuracoesRepasse'
import type { Parcela } from './gerenciarParcelamentos'

// Re-exportar Parcela para uso em outros arquivos
export type { Parcela }

export type StatusPedido = 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'em_transito' | 'entregue' | 'cancelado'
export type FormaPagamento = 'pix_vista' | 'pix_parcelado'
export type TipoEntrega = 'retirar_local' | 'receber_endereco' | 'agendar'

export interface Pedido {
  id: string
  cliente_id: string
  revenda_id: string
  unidade_id: string | null
  status: StatusPedido
  forma_pagamento: FormaPagamento
  parcelas_total: number | null
  valor_total: number
  valor_entrada: number | null
  taxa_entrega: number
  tipo_entrega: TipoEntrega
  endereco_entrega_id: string | null
  agendamento_entrega_id: string | null
  observacoes: string | null
  dados_cliente: {
    nome: string
    email: string
    telefone: string
    cpf?: string
  }
  criado_em: string
  atualizado_em: string
  revenda?: {
    id: string
    nome_revenda: string
    nome_publico?: string | null
    cnpj?: string | null
    nome_responsavel?: string | null
    cpf_responsavel?: string | null
    telefone?: string | null
    cep?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
    cidade?: string | null
    estado?: string | null
    logo_url?: string | null
    descricao_loja?: string | null
    link_publico?: string | null
    marcas_trabalhadas?: string[] | string | null
  }
  unidade?: {
    id: string
    nome: string
    nome_publico?: string | null
    link_publico?: string | null
    link_publico_ativo?: boolean
  }
  cliente?: {
    id: string
    nome_completo: string | null
    email: string
  }
  itens?: Array<{
    id: string
    produto_id: string
    quantidade: number
    preco_unitario: number
    subtotal?: number
    produto?: {
      id: string
      nome: string
      imagem_url: string | null
      unidade_id?: string | null
    }
  }>
  parcelamento?: {
    id: string
    pedido_id: string
    total_parcelas: number
    valor_total: number
    valor_parcela: number
    status: 'ativo' | 'quitado' | 'cancelado'
    parcelas?: Parcela[]
  }
  endereco_entrega?: {
    id: string
    nome_endereco: string | null
    cep: string
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
  }
  transacao_financeira?: {
    id: string
    valor_bruto: number
    valor_liquido: number
    taxa_percentual: number
    taxa_fixa: number
    modalidade: 'D+1' | 'D+15' | 'D+30'
    status: 'pendente' | 'liberado' | 'repassado' | 'cancelado'
    data_pagamento: string
    data_repasse_prevista: string
  }
  agendamento_entrega?: {
    id: string
    data_agendamento: string
    horario: string | null
    horario_inicio: string | null
    horario_fim: string | null
    observacoes: string | null
  }
}

export interface DadosPedido {
  revenda_id: string
  unidade_id?: string | null
  forma_pagamento: FormaPagamento
  parcelas_total?: number | null
  dias_segunda_parcela?: number | null
  taxa_entrega?: number
  tipo_entrega: TipoEntrega
  endereco_entrega_id?: string | null
  agendamento_entrega_id?: string | null
  observacoes?: string | null
  dados_cliente: {
    nome: string
    email: string
    telefone: string
    cpf?: string
  }
  itens: Array<{
    produto_id: string
    quantidade: number
    preco_unitario: number
  }>
}

/**
 * Cria um novo pedido
 */
export async function criarPedido(
  dados: DadosPedido
): Promise<{ pedido: Pedido | null; error: Error | null; mensagem?: string }> {
  try {
    // Busca sessão atual para obter cliente_id
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return {
        pedido: null,
        error: new Error('Usuário não autenticado'),
        mensagem: 'É necessário estar autenticado para finalizar o pedido',
      }
    }

    const clienteId = session.user.id

    // Validações
    if (!dados.revenda_id) {
      return {
        pedido: null,
        error: new Error('Revenda não informada'),
        mensagem: 'Revenda não informada',
      }
    }

    if (!dados.dados_cliente) {
      return {
        pedido: null,
        error: new Error('Dados do cliente não informados'),
        mensagem: 'Dados do cliente são obrigatórios',
      }
    }

    if (!dados.dados_cliente.nome || !dados.dados_cliente.email || !dados.dados_cliente.telefone) {
      return {
        pedido: null,
        error: new Error('Dados do cliente incompletos'),
        mensagem: 'Nome, email e telefone são obrigatórios',
      }
    }

    if (!dados.itens || dados.itens.length === 0) {
      return {
        pedido: null,
        error: new Error('Nenhum item no pedido'),
        mensagem: 'O pedido deve conter pelo menos um item',
      }
    }

    // Valida itens
    for (const item of dados.itens) {
      if (!item.produto_id) {
        return {
          pedido: null,
          error: new Error('Produto não informado'),
          mensagem: 'Um ou mais itens não possuem produto informado',
        }
      }
      if (!item.quantidade || item.quantidade <= 0) {
        return {
          pedido: null,
          error: new Error('Quantidade inválida'),
          mensagem: 'A quantidade deve ser maior que zero',
        }
      }
      if (!item.preco_unitario || item.preco_unitario < 0) {
        return {
          pedido: null,
          error: new Error('Preço inválido'),
          mensagem: 'Um ou mais itens possuem preço inválido',
        }
      }
    }

    // Calcula subtotal dos itens
    const subtotalItens = dados.itens.reduce((total, item) => {
      return total + item.preco_unitario * item.quantidade
    }, 0)
    
    // Adiciona taxa de entrega se houver
    const taxaEntrega = dados.taxa_entrega || 0.00
    const valorTotal = subtotalItens + taxaEntrega

    if (valorTotal <= 0) {
      return {
        pedido: null,
        error: new Error('Valor total inválido'),
        mensagem: 'O valor total do pedido deve ser maior que zero',
      }
    }

    // Calcula valor de entrada (primeira parcela se parcelado)
    const valorEntrada = dados.forma_pagamento === 'pix_parcelado' && dados.parcelas_total
      ? valorTotal / dados.parcelas_total
      : null

    // Determina unidade_id: valida que todos os produtos são da mesma unidade
    let unidadeIdFinal = dados.unidade_id || null
    
    // Busca unidades de todos os produtos para validar consistência
    if (dados.itens.length > 0) {
      const produtosIds = dados.itens.map(item => item.produto_id)
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, unidade_id, revenda_id')
        .in('id', produtosIds)
      
      if (produtosError) {
        console.error('❌ [criarPedido] Erro ao buscar produtos:', produtosError)
        return {
          pedido: null,
          error: produtosError,
          mensagem: 'Erro ao validar produtos do pedido',
        }
      }
      
      if (produtosData && produtosData.length > 0) {
        // Verifica se todos os produtos são da mesma revenda
        const revendasIds = [...new Set(produtosData.map(p => p.revenda_id).filter(Boolean))]
        if (revendasIds.length > 1) {
          return {
            pedido: null,
            error: new Error('Produtos de revendas diferentes'),
            mensagem: 'Não é possível criar um pedido com produtos de revendas diferentes',
          }
        }
        
        // Verifica unidades dos produtos
        const unidadesIds = produtosData
          .map(p => p.unidade_id)
          .filter((id): id is string => id !== null && id !== undefined)
        
        const unidadesUnicas = [...new Set(unidadesIds)]
        
        if (unidadesUnicas.length > 1) {
          // Produtos de unidades diferentes - não permitir
          return {
            pedido: null,
            error: new Error('Produtos de unidades diferentes'),
            mensagem: 'Não é possível criar um pedido com produtos de unidades diferentes. Por favor, separe os produtos por unidade.',
          }
        }
        
        // Se unidade_id foi fornecido explicitamente, valida que corresponde aos produtos
        if (unidadeIdFinal) {
          if (unidadesUnicas.length === 1 && unidadesUnicas[0] !== unidadeIdFinal) {
            console.warn('⚠️ [criarPedido] Unidade_id fornecido não corresponde aos produtos. Usando unidade dos produtos.')
            unidadeIdFinal = unidadesUnicas[0]
          }
        } else if (unidadesUnicas.length === 1) {
          // Usa a unidade dos produtos
          unidadeIdFinal = unidadesUnicas[0]
          console.log('✅ [criarPedido] Unidade_id determinado pelos produtos:', unidadeIdFinal)
        } else {
          // Produtos sem unidade (legado) - permite mas sem unidade_id
          console.log('⚠️ [criarPedido] Produtos sem unidade_id (legado)')
          unidadeIdFinal = null
        }
      }
    }

    // Cria o pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        revenda_id: dados.revenda_id,
        unidade_id: unidadeIdFinal,
        forma_pagamento: dados.forma_pagamento,
        parcelas_total: dados.parcelas_total || null,
        valor_total: valorTotal,
        valor_entrada: valorEntrada,
        taxa_entrega: taxaEntrega,
        tipo_entrega: dados.tipo_entrega,
        endereco_entrega_id: dados.endereco_entrega_id || null,
        agendamento_entrega_id: dados.agendamento_entrega_id || null,
        observacoes: dados.observacoes || null,
        dados_cliente: dados.dados_cliente,
      })
      .select()
      .single()

    if (pedidoError) {
      console.error('❌ Erro ao criar pedido:', pedidoError)
      console.error('❌ Detalhes do erro:', {
        message: pedidoError.message,
        details: (pedidoError as any).details,
        hint: (pedidoError as any).hint,
        code: (pedidoError as any).code,
      })
      console.error('❌ Dados do pedido:', {
        cliente_id: clienteId,
        revenda_id: dados.revenda_id,
        forma_pagamento: dados.forma_pagamento,
        parcelas_total: dados.parcelas_total,
        valor_total: valorTotal,
        valor_entrada: valorEntrada,
        tipo_entrega: dados.tipo_entrega,
        itens_count: dados.itens.length,
      })
      return {
        pedido: null,
        error: pedidoError,
        mensagem: traduzirErro(pedidoError.message) || `Erro ao criar pedido: ${pedidoError.message || 'Erro desconhecido'}`,
      }
    }

    // Cria os itens do pedido
    const itensPedido = dados.itens.map(item => ({
      pedido_id: pedidoData.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.preco_unitario * item.quantidade,
    }))

    const { error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensPedido)

    if (itensError) {
      console.error('❌ Erro ao criar itens do pedido:', itensError)
      // Tenta remover o pedido criado
      await supabase.from('pedidos').delete().eq('id', pedidoData.id)
      return {
        pedido: null,
        error: itensError,
        mensagem: 'Erro ao criar itens do pedido',
      }
    }

    // Se for parcelado, cria o parcelamento e as parcelas
    if (dados.forma_pagamento === 'pix_parcelado' && dados.parcelas_total) {
      const valorParcela = valorTotal / dados.parcelas_total
      // 2x sempre em 15 dias, 3x tem segunda em 15 e terceira em 30

      // Cria parcelamento
      const { data: parcelamentoData, error: parcelamentoError } = await supabase
        .from('parcelamentos')
        .insert({
          pedido_id: pedidoData.id,
          total_parcelas: dados.parcelas_total,
          valor_total: valorTotal,
          valor_parcela: valorParcela,
          status: 'ativo',
        })
        .select()
        .single()

      if (parcelamentoError) {
        console.error('❌ Erro ao criar parcelamento:', parcelamentoError)
        console.error('❌ Detalhes do erro de parcelamento:', {
          message: parcelamentoError.message,
          details: (parcelamentoError as any).details,
          hint: (parcelamentoError as any).hint,
          code: (parcelamentoError as any).code,
        })
        console.error('❌ Dados do parcelamento:', {
          pedido_id: pedidoData.id,
          total_parcelas: dados.parcelas_total,
          valor_total: valorTotal,
          valor_parcela: valorParcela,
          cliente_id: clienteId,
        })
        return {
          pedido: null,
          error: parcelamentoError,
          mensagem: `Erro ao criar parcelamento: ${parcelamentoError.message || 'Erro desconhecido'}`,
        }
      }

      // Cria as parcelas
      const parcelas = []
      const hoje = new Date()

      for (let i = 1; i <= dados.parcelas_total; i++) {
        let dataVencimento = new Date(hoje)

        if (i === 1) {
          // Primeira parcela (entrada) - vencimento hoje
          dataVencimento = hoje
        } else if (i === 2 && dados.parcelas_total === 2) {
          // Segunda parcela em 2x - sempre 15 dias
          dataVencimento.setDate(hoje.getDate() + 15)
        } else if (i === 2 && dados.parcelas_total === 3) {
          // Segunda parcela em 3x - 15 dias
          dataVencimento.setDate(hoje.getDate() + 15)
        } else if (i === 3) {
          // Terceira parcela em 3x - 30 dias
          dataVencimento.setDate(hoje.getDate() + 30)
        }

        parcelas.push({
          parcelamento_id: parcelamentoData.id,
          numero_parcela: i,
          valor: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: i === 1 ? 'paga' : 'pendente', // Primeira parcela marcada como paga (entrada)
          data_pagamento: i === 1 ? new Date().toISOString().split('T')[0] : null, // Formato DATE (YYYY-MM-DD)
        })
      }

      const { error: parcelasError } = await supabase
        .from('parcelas')
        .insert(parcelas)

      if (parcelasError) {
        console.error('❌ Erro ao criar parcelas:', parcelasError)
        console.error('❌ Detalhes do erro de parcelas:', {
          message: parcelasError.message,
          details: (parcelasError as any).details,
          hint: (parcelasError as any).hint,
          code: (parcelasError as any).code,
        })
        console.error('❌ Dados das parcelas:', {
          parcelamento_id: parcelamentoData.id,
          quantidade_parcelas: parcelas.length,
          parcelas: parcelas.map(p => ({ numero: p.numero_parcela, valor: p.valor, status: p.status })),
        })
        return {
          pedido: null,
          error: parcelasError,
          mensagem: `Erro ao criar parcelas: ${parcelasError.message || 'Erro desconhecido'}`,
        }
      }

      console.log('✅ Parcelamento e parcelas criados com sucesso:', {
        parcelamento_id: parcelamentoData.id,
        total_parcelas: dados.parcelas_total,
        parcelas_criadas: parcelas.length,
      })
    }

    // Cria transação financeira
    // Para pagamentos à vista: cria transação única
    // Para pagamentos parcelados: cria transação quando primeira parcela é paga (entrada)
    const dataPagamento = new Date().toISOString()
    console.log('📊 Tentando criar transação financeira:', {
      pedidoId: pedidoData.id,
      revendaId: dados.revenda_id,
      clienteId,
      valorTotal,
      dataPagamento,
    })
    
    // Tenta criar transação financeira com retry
    let transacao = null
    let transacaoError = null
    let transacaoMensagem: string | undefined = undefined
    let tentativas = 0
    const maxTentativas = 3
    
    while (tentativas < maxTentativas && !transacao) {
      const resultado = await criarTransacaoFinanceira(
        pedidoData.id,
        dados.revenda_id,
        clienteId,
        valorTotal,
        dataPagamento,
        dados.unidade_id || null
      )
      
      transacao = resultado.transacao
      transacaoError = resultado.error
      transacaoMensagem = resultado.mensagem
      
      if (transacaoError && tentativas < maxTentativas - 1) {
        console.warn(`⚠️ Tentativa ${tentativas + 1} falhou, tentando novamente em 1 segundo...`, {
          error: transacaoError,
          mensagem: transacaoMensagem,
        })
        await new Promise(resolve => setTimeout(resolve, 1000)) // Aguarda 1 segundo antes de tentar novamente
      }
      
      tentativas++
    }

    if (transacaoError || !transacao) {
      console.error('❌ Erro ao criar transação financeira após múltiplas tentativas:', {
        error: transacaoError,
        mensagem: transacaoMensagem,
        pedidoId: pedidoData.id,
        revendaId: dados.revenda_id,
        tentativas,
        temTransacao: !!transacao,
      })
      
      // CRÍTICO: Se não conseguiu criar a transação, tenta criar diretamente via SQL como último recurso
      console.warn('🔄 [criarPedido] Tentando criar transação financeira diretamente via SQL como último recurso...')
      
      try {
        // PRIMEIRO: Verifica se a unidade tem modalidade específica definida
        let modalidade: 'D+1' | 'D+15' | 'D+30' = 'D+1'
        let taxaPercentual = 8.0
        let taxaFixa = 0.5
        
        if (dados.unidade_id) {
          console.log('🔍 [criarPedido] Verificando modalidade da unidade no fallback:', dados.unidade_id)
          const { data: unidadeData } = await supabase
            .from('unidades_revenda')
            .select('modalidade_repasse, taxa_repasse_percentual, taxa_repasse_fixa')
            .eq('id', dados.unidade_id)
            .eq('revenda_id', dados.revenda_id)
            .maybeSingle()

          if (unidadeData && unidadeData.modalidade_repasse) {
            modalidade = unidadeData.modalidade_repasse as 'D+1' | 'D+15' | 'D+30'
            console.log('✅ [criarPedido] Usando modalidade da unidade no fallback:', modalidade)
            
            // Se a unidade tem taxas personalizadas, usa elas
            if (unidadeData.taxa_repasse_percentual !== null && unidadeData.taxa_repasse_percentual !== undefined) {
              taxaPercentual = Number(unidadeData.taxa_repasse_percentual)
              taxaFixa = unidadeData.taxa_repasse_fixa !== null && unidadeData.taxa_repasse_fixa !== undefined
                ? Number(unidadeData.taxa_repasse_fixa)
                : 0.5
            } else {
              // Busca taxas da configuração da revenda para a modalidade da unidade
              const { configuracao: configModalidade } = await buscarConfiguracaoRepasseAtiva(dados.revenda_id)
              if (configModalidade && configModalidade.modalidade === modalidade) {
                taxaPercentual = configModalidade.taxa_percentual
                taxaFixa = configModalidade.taxa_fixa
              } else {
                // Usa valores padrão para a modalidade
                const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
                  'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
                  'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
                  'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
                }
                const padrao = padroes[modalidade]
                taxaPercentual = padrao.taxaPercentual
                taxaFixa = padrao.taxaFixa
              }
            }
          } else {
            // Se unidade não tem modalidade específica, busca configuração ativa da revenda
            const { configuracao: configAtiva } = await buscarConfiguracaoRepasseAtiva(dados.revenda_id)
            if (configAtiva) {
              modalidade = configAtiva.modalidade
              taxaPercentual = configAtiva.taxa_percentual
              taxaFixa = configAtiva.taxa_fixa
            }
          }
        } else {
          // Se não há unidadeId, busca configuração ativa da revenda
          const { configuracao: configAtiva } = await buscarConfiguracaoRepasseAtiva(dados.revenda_id)
          if (configAtiva) {
            modalidade = configAtiva.modalidade
            taxaPercentual = configAtiva.taxa_percentual
            taxaFixa = configAtiva.taxa_fixa
          }
        }
        
        // Calcula valores
        const taxaPercentualValor = (valorTotal * taxaPercentual) / 100
        const valorLiquido = Math.max(0, valorTotal - taxaPercentualValor - taxaFixa)
        
        // Calcula data de repasse
        const dataPagamentoDate = new Date(dataPagamento)
        const dataRepassePrevista = new Date(dataPagamentoDate)
        if (modalidade === 'D+1') {
          dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 1)
        } else if (modalidade === 'D+15') {
          dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 15)
        } else {
          dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 30)
        }
        
        // Tenta criar usando função RPC diretamente
        const { data: rpcDataFinal, error: rpcErrorFinal } = await supabase.rpc('criar_transacao_financeira', {
          p_pedido_id: pedidoData.id,
          p_revenda_id: dados.revenda_id,
          p_cliente_id: clienteId,
          p_valor_bruto: valorTotal,
          p_taxa_percentual: taxaPercentual,
          p_taxa_fixa: taxaFixa,
          p_valor_liquido: Math.round(valorLiquido * 100) / 100,
          p_modalidade: modalidade,
          p_data_pagamento: dataPagamento,
          p_data_repasse_prevista: dataRepassePrevista.toISOString().split('T')[0],
        })
        
        if (rpcErrorFinal) {
          console.error('❌ [criarPedido] Erro ao criar transação financeira diretamente:', rpcErrorFinal)
          // Tenta INSERT direto como último recurso
          const { data: insertData, error: insertError } = await supabase
            .from('transacoes_financeiras')
            .insert({
              pedido_id: pedidoData.id,
              revenda_id: dados.revenda_id,
              cliente_id: clienteId,
              valor_bruto: valorTotal,
              taxa_percentual: taxaPercentual,
              taxa_fixa: taxaFixa,
              valor_liquido: Math.round(valorLiquido * 100) / 100,
              modalidade: modalidade,
              data_pagamento: dataPagamento,
              data_repasse_prevista: dataRepassePrevista.toISOString().split('T')[0],
              status: 'pendente',
            })
            .select()
            .single()
          
          if (insertError) {
            console.error('❌ [criarPedido] Erro ao criar transação financeira via INSERT direto:', insertError)
          } else {
            console.log('✅ [criarPedido] Transação financeira criada via INSERT direto:', insertData)
            transacao = insertData as any
          }
        } else if (rpcDataFinal) {
          // Busca a transação criada
          const { data: transacaoCriada } = await supabase
            .from('transacoes_financeiras')
            .select('*')
            .eq('id', rpcDataFinal)
            .single()
          
          if (transacaoCriada) {
            console.log('✅ [criarPedido] Transação financeira criada via RPC direto:', transacaoCriada)
            transacao = transacaoCriada as any
          }
        }
      } catch (errorFinal) {
        console.error('❌ [criarPedido] Erro inesperado ao tentar criar transação financeira diretamente:', errorFinal)
      }
    }
    
    if (transacao) {
      console.log('✅ Transação financeira criada com sucesso:', {
        transacaoId: transacao.id,
        valorBruto: transacao.valor_bruto,
        valorLiquido: transacao.valor_liquido,
        modalidade: transacao.modalidade,
        status: transacao.status,
        tentativas,
      })
    } else {
      console.error('❌ CRÍTICO: Transação financeira não foi criada após todas as tentativas:', {
        pedidoId: pedidoData.id,
        revendaId: dados.revenda_id,
        tentativas,
      })
    }

    return {
      pedido: pedidoData as Pedido,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar pedido:', error)
    return {
      pedido: null,
      error: error instanceof Error ? error : new Error('Erro ao criar pedido'),
      mensagem: 'Erro inesperado ao criar pedido',
    }
  }
}

/**
 * Lista pedidos do cliente atual
 */
export async function listarPedidosCliente(): Promise<{ pedidos: Pedido[]; error: Error | null }> {
  try {
    // Obtém o cliente_id considerando modo impersonation
    const { obterClienteUserId } = await import('./impersonation')
    const clienteUserId = await obterClienteUserId()
    
    // Se não está em modo impersonation, usa a sessão atual
    let clienteId = clienteUserId
    if (!clienteId) {
      const { data: sessionData } = await supabase.auth.getSession()
      clienteId = sessionData?.session?.user?.id
    }

    if (!clienteId) {
      console.warn('⚠️ Usuário não autenticado')
      return {
        pedidos: [],
        error: new Error('Usuário não autenticado'),
      }
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico,
          logo_url,
          descricao_loja,
          link_publico
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico
        )
      `)
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar pedidos:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      })
      return {
        pedidos: [],
        error,
      }
    }

    // Se algum pedido tem unidade_id mas não retornou unidade, busca separadamente
    const pedidosComUnidadeId = (data || []).filter((p: any) => p.unidade_id && !p.unidade)
    
    if (pedidosComUnidadeId.length > 0) {
      console.log('⚠️ [listarPedidosCliente] Alguns pedidos têm unidade_id mas unidade não retornou, buscando separadamente...', {
        quantidade: pedidosComUnidadeId.length,
      })
      
      const unidadesIds = [...new Set(pedidosComUnidadeId.map((p: any) => p.unidade_id).filter(Boolean))]
      
      if (unidadesIds.length > 0) {
        const { data: unidadesData } = await supabase
          .from('unidades_revenda')
          .select('id, nome, nome_publico, link_publico, link_publico_ativo')
          .in('id', unidadesIds)
        
        if (unidadesData) {
          const unidadesMap = new Map(unidadesData.map((u: any) => [u.id, u]))
          
          // Atualiza os pedidos com as unidades encontradas
          data?.forEach((pedido: any) => {
            if (pedido.unidade_id && !pedido.unidade) {
              const unidade = unidadesMap.get(pedido.unidade_id)
              if (unidade) {
                pedido.unidade = unidade
                console.log('✅ [listarPedidosCliente] Unidade encontrada para pedido:', {
                  pedidoId: pedido.id.slice(0, 8),
                  unidadeNome: unidade.nome_publico || unidade.nome,
                })
              }
            }
          })
        }
      }
    }

    console.log('📦 [listarPedidosCliente] Pedidos retornados:', {
      total: data?.length || 0,
      comUnidadeId: (data || []).filter((p: any) => p.unidade_id).length,
      comUnidadeObjeto: (data || []).filter((p: any) => p.unidade).length,
    })

    return {
      pedidos: (data || []) as Pedido[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar pedidos:', error)
    return {
      pedidos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar pedidos'),
    }
  }
}

/**
 * Lista pedidos de uma revenda
 */
export async function listarPedidosRevenda(
  revendaId: string,
  unidadeId?: string | null
): Promise<{ pedidos: Pedido[]; error: Error | null }> {
  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico,
          link_publico,
          link_publico_ativo
        ),
        cliente:usuarios!pedidos_cliente_id_fkey (
          id,
          nome_completo,
          email
        ),
        itens:itens_pedido (
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          produto:produtos (
            id,
            nome,
            imagem_url
          )
        ),
        transacao_financeira:transacoes_financeiras!transacoes_financeiras_pedido_id_fkey (
          id,
          valor_bruto,
          valor_liquido,
          taxa_percentual,
          taxa_fixa,
          modalidade,
          status,
          data_pagamento,
          data_repasse_prevista
        )
      `)
      .eq('revenda_id', revendaId)

    // Se unidadeId for fornecido, filtra por unidade
    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    }

    const { data, error } = await query
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar pedidos da revenda:', error)
      return {
        pedidos: [],
        error,
      }
    }

    // Processa os dados para garantir que transacao_financeira seja um objeto único e converter valores
    const pedidosProcessados = (data || []).map((pedido: any) => {
      // Processa transacao_financeira: pode vir como array ou objeto único
      let transacaoFinanceira = null
      if (pedido.transacao_financeira) {
        if (Array.isArray(pedido.transacao_financeira)) {
          transacaoFinanceira = pedido.transacao_financeira[0] || null
        } else {
          transacaoFinanceira = pedido.transacao_financeira
        }
        
        // Converte valores de string para número (DECIMAL do PostgreSQL vem como string)
        if (transacaoFinanceira) {
          transacaoFinanceira = {
            ...transacaoFinanceira,
            valor_bruto: typeof transacaoFinanceira.valor_bruto === 'string' 
              ? parseFloat(transacaoFinanceira.valor_bruto) 
              : (transacaoFinanceira.valor_bruto || 0),
            valor_liquido: typeof transacaoFinanceira.valor_liquido === 'string' 
              ? parseFloat(transacaoFinanceira.valor_liquido) 
              : (transacaoFinanceira.valor_liquido || 0),
            taxa_percentual: typeof transacaoFinanceira.taxa_percentual === 'string' 
              ? parseFloat(transacaoFinanceira.taxa_percentual) 
              : (transacaoFinanceira.taxa_percentual || 0),
            taxa_fixa: typeof transacaoFinanceira.taxa_fixa === 'string' 
              ? parseFloat(transacaoFinanceira.taxa_fixa) 
              : (transacaoFinanceira.taxa_fixa || 0),
          }
        }
      }
      
      return {
        ...pedido,
        transacao_financeira: transacaoFinanceira,
      }
    })

    return {
      pedidos: pedidosProcessados as Pedido[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar pedidos da revenda:', error)
    return {
      pedidos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar pedidos'),
    }
  }
}

/**
 * Lista todos os pedidos (Admin) - com filtro opcional por revenda
 */
export async function listarPedidosAdmin(revendaId?: string, unidadeId?: string | null): Promise<{ pedidos: Pedido[]; error: Error | null }> {
  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico,
          link_publico,
          link_publico_ativo
        ),
        cliente:usuarios!pedidos_cliente_id_fkey (
          id,
          nome_completo,
          email
        ),
        itens:itens_pedido (
          *,
          produto:produtos (
            id,
            nome,
            imagem_url
          )
        ),
        parcelamento:parcelamentos (
          *,
          parcelas:parcelas (*)
        ),
        endereco_entrega:enderecos_entrega!pedidos_endereco_entrega_id_fkey (*),
        agendamento_entrega:agendamentos_entrega!fk_pedidos_agendamento_entrega (*),
        transacao_financeira:transacoes_financeiras (*)
      `)
      .order('criado_em', { ascending: false })

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao listar pedidos (Admin):', error)
      return {
        pedidos: [],
        error,
      }
    }

    // Processa parcelamento e transacao_financeira para garantir formato correto
    const pedidosProcessados = (data || []).map((pedido: any) => {
      // Processa transacao_financeira: pode vir como array ou objeto único
      let transacaoFinanceira = null
      if (pedido.transacao_financeira) {
        if (Array.isArray(pedido.transacao_financeira)) {
          transacaoFinanceira = pedido.transacao_financeira[0] || null
        } else {
          transacaoFinanceira = pedido.transacao_financeira
        }
        
        // Converte valores de string para número (DECIMAL do PostgreSQL vem como string)
        if (transacaoFinanceira) {
          transacaoFinanceira = {
            ...transacaoFinanceira,
            valor_bruto: typeof transacaoFinanceira.valor_bruto === 'string' 
              ? parseFloat(transacaoFinanceira.valor_bruto) 
              : (transacaoFinanceira.valor_bruto || 0),
            valor_liquido: typeof transacaoFinanceira.valor_liquido === 'string' 
              ? parseFloat(transacaoFinanceira.valor_liquido) 
              : (transacaoFinanceira.valor_liquido || 0),
            taxa_percentual: typeof transacaoFinanceira.taxa_percentual === 'string' 
              ? parseFloat(transacaoFinanceira.taxa_percentual) 
              : (transacaoFinanceira.taxa_percentual || 0),
            taxa_fixa: typeof transacaoFinanceira.taxa_fixa === 'string' 
              ? parseFloat(transacaoFinanceira.taxa_fixa) 
              : (transacaoFinanceira.taxa_fixa || 0),
          }
        }
      }
      
      // Processa parcelamento
      if (pedido.parcelamento) {
        const parcelamentoRaw = Array.isArray(pedido.parcelamento)
          ? pedido.parcelamento[0]
          : pedido.parcelamento

        let parcelasArray = []
        if (parcelamentoRaw?.parcelas) {
          if (Array.isArray(parcelamentoRaw.parcelas)) {
            parcelasArray = parcelamentoRaw.parcelas
          } else {
            parcelasArray = [parcelamentoRaw.parcelas]
          }
        }

        return {
          ...pedido,
          transacao_financeira: transacaoFinanceira,
          parcelamento: {
            ...parcelamentoRaw,
            parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
          },
        }
      }
      
      return {
        ...pedido,
        transacao_financeira: transacaoFinanceira,
      }
    })

    return {
      pedidos: pedidosProcessados as Pedido[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar pedidos (Admin):', error)
    return {
      pedidos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar pedidos'),
    }
  }
}

/**
 * Busca um pedido por ID (genérico) - Para Admin
 */
export async function buscarPedido(pedidoId: string): Promise<{ pedido: Pedido | null; error: Error | null }> {
  try {
    // Busca o pedido primeiro sem relacionamentos complexos
    // Garante que unidade_id seja incluído na busca
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, cliente_id, revenda_id, unidade_id, status, forma_pagamento, parcelas_total, valor_total, valor_entrada, taxa_entrega, tipo_entrega, endereco_entrega_id, agendamento_entrega_id, observacoes, dados_cliente, criado_em, atualizado_em')
      .eq('id', pedidoId)
      .maybeSingle()

    if (pedidoError || !pedidoData) {
      console.error('❌ Erro ao buscar pedido:', pedidoError)
      return {
        pedido: null,
        error: pedidoError || new Error('Pedido não encontrado'),
      }
    }

    // Busca relacionamentos separadamente para evitar erro de coerção
    const [revendaResult, unidadeResult, clienteResult, transacaoResult, itensResult, parcelamentoResult, enderecoResult, agendamentoResult] = await Promise.all([
      supabase.from('revendas').select('id, nome_revenda, nome_publico').eq('id', pedidoData.revenda_id).maybeSingle(),
      pedidoData.unidade_id 
        ? supabase.from('unidades_revenda').select('id, nome, nome_publico').eq('id', pedidoData.unidade_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from('usuarios').select('id, nome_completo, email').eq('id', pedidoData.cliente_id).maybeSingle(),
      supabase.from('transacoes_financeiras').select('id, valor_bruto, valor_liquido, taxa_percentual, taxa_fixa, modalidade, status, data_pagamento, data_repasse_prevista').eq('pedido_id', pedidoId).maybeSingle(),
      supabase.from('itens_pedido').select(`
        id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        produto:produtos (
          id,
          nome,
          imagem_url,
          unidade_id
        )
      `).eq('pedido_id', pedidoId),
      pedidoData.forma_pagamento === 'pix_parcelado'
        ? supabase.from('parcelamentos').select(`
          *,
          parcelas:parcelas (*)
        `).eq('pedido_id', pedidoId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      pedidoData.endereco_entrega_id
        ? supabase.from('enderecos_entrega').select('*').eq('id', pedidoData.endereco_entrega_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      pedidoData.agendamento_entrega_id
        ? supabase.from('agendamentos_entrega').select('*').eq('id', pedidoData.agendamento_entrega_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    // Processa parcelamento
    let parcelamentoProcessado = null
    if (parcelamentoResult.data) {
      const parcelamentoRaw = parcelamentoResult.data
      let parcelasArray = []
      if (parcelamentoRaw?.parcelas) {
        if (Array.isArray(parcelamentoRaw.parcelas)) {
          parcelasArray = parcelamentoRaw.parcelas
        } else {
          parcelasArray = [parcelamentoRaw.parcelas]
        }
      }

      parcelamentoProcessado = {
        ...parcelamentoRaw,
        parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
      }
    } else if (pedidoData.forma_pagamento === 'pix_parcelado') {
      // Se é parcelado mas não encontrou parcelamento, tenta buscar separadamente
      console.warn('⚠️ Parcelamento não encontrado na query principal, buscando separadamente...')
      const { data: parcelamentoSeparado, error: parcelamentoError } = await supabase
        .from('parcelamentos')
        .select(`
          id,
          pedido_id,
          total_parcelas,
          valor_total,
          valor_parcela,
          status,
          criado_em,
          atualizado_em,
          parcelas:parcelas (
            id,
            parcelamento_id,
            numero_parcela,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            pix_copia_cola,
            criado_em,
            atualizado_em
          )
        `)
        .eq('pedido_id', pedidoId)
        .maybeSingle()

      if (!parcelamentoError && parcelamentoSeparado) {
        let parcelasArray = []
        if (parcelamentoSeparado?.parcelas) {
          if (Array.isArray(parcelamentoSeparado.parcelas)) {
            parcelasArray = parcelamentoSeparado.parcelas
          } else {
            parcelasArray = [parcelamentoSeparado.parcelas]
          }
        }

        parcelamentoProcessado = {
          ...parcelamentoSeparado,
          parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
        }
        console.log('✅ Parcelamento encontrado separadamente:', parcelamentoProcessado)
      } else {
        console.error('❌ Erro ao buscar parcelamento separadamente:', parcelamentoError)
      }
    }

    // Processa endereco_entrega - garante que seja sempre um objeto
    let enderecoProcessado = undefined
    if (enderecoResult.data) {
      enderecoProcessado = Array.isArray(enderecoResult.data) 
        ? enderecoResult.data[0] 
        : enderecoResult.data
      console.log('✅ [buscarPedido] Endereço processado:', enderecoProcessado)
    }

    // Processa agendamento_entrega - garante que seja sempre um objeto
    let agendamentoProcessado = undefined
    if (agendamentoResult.data) {
      agendamentoProcessado = Array.isArray(agendamentoResult.data) 
        ? agendamentoResult.data[0] 
        : agendamentoResult.data
      console.log('✅ [buscarPedido] Agendamento processado:', agendamentoProcessado)
    }

    // Processa transacao_financeira - converte valores de string para número
    let transacaoProcessada = undefined
    if (transacaoResult.data) {
      const transacaoRaw = Array.isArray(transacaoResult.data) 
        ? transacaoResult.data[0] 
        : transacaoResult.data
      
      if (transacaoRaw) {
        transacaoProcessada = {
          ...transacaoRaw,
          valor_bruto: typeof transacaoRaw.valor_bruto === 'string' 
            ? parseFloat(transacaoRaw.valor_bruto) 
            : (transacaoRaw.valor_bruto || 0),
          valor_liquido: typeof transacaoRaw.valor_liquido === 'string' 
            ? parseFloat(transacaoRaw.valor_liquido) 
            : (transacaoRaw.valor_liquido || 0),
          taxa_percentual: typeof transacaoRaw.taxa_percentual === 'string' 
            ? parseFloat(transacaoRaw.taxa_percentual) 
            : (transacaoRaw.taxa_percentual || 0),
          taxa_fixa: typeof transacaoRaw.taxa_fixa === 'string' 
            ? parseFloat(transacaoRaw.taxa_fixa) 
            : (transacaoRaw.taxa_fixa || 0),
        }
        console.log('✅ [buscarPedido] Transação financeira processada:', transacaoProcessada)
      }
    }

    const pedidoCompleto: Pedido = {
      ...pedidoData,
      revenda: revendaResult.data || undefined,
      unidade: unidadeResult.data ? {
        id: unidadeResult.data.id,
        nome: unidadeResult.data.nome,
        nome_publico: unidadeResult.data.nome_publico || null,
      } : undefined,
      cliente: clienteResult.data || undefined,
      itens: itensResult.data || [],
      parcelamento: parcelamentoProcessado || undefined,
      endereco_entrega: enderecoProcessado,
      agendamento_entrega: agendamentoProcessado,
      transacao_financeira: transacaoProcessada,
    }

    console.log('📦 [buscarPedido] Dados finais:', {
      pedidoId,
      tipoEntrega: pedidoCompleto.tipo_entrega,
      temEndereco: !!pedidoCompleto.endereco_entrega,
      temAgendamento: !!pedidoCompleto.agendamento_entrega,
      endereco: pedidoCompleto.endereco_entrega,
      agendamento: pedidoCompleto.agendamento_entrega,
    })

    return {
      pedido: pedidoCompleto,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar pedido:', error)
    return {
      pedido: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar pedido'),
    }
  }
}

/**
 * Busca um pedido do cliente atual
 */
export async function buscarPedidoCliente(pedidoId: string): Promise<{ pedido: Pedido | null; error: Error | null }> {
  try {
    // Obtém o cliente_id do usuário autenticado
    const { data: sessionData } = await supabase.auth.getSession()
    const clienteId = sessionData?.session?.user?.id

    if (!clienteId) {
      return {
        pedido: null,
        error: new Error('Usuário não autenticado'),
      }
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico,
          cnpj,
          nome_responsavel,
          cpf_responsavel,
          telefone,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          logo_url,
          descricao_loja,
          link_publico,
          marcas_trabalhadas
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico,
          link_publico,
          link_publico_ativo
        ),
        itens:itens_pedido (
          *,
          produto:produtos (
            id,
            nome,
            imagem_url
          )
        ),
        parcelamento:parcelamentos (
          *,
          parcelas:parcelas (*)
        ),
        endereco_entrega:enderecos_entrega!pedidos_endereco_entrega_id_fkey (*),
        agendamento_entrega:agendamentos_entrega!fk_pedidos_agendamento_entrega (*)
      `)
      .eq('id', pedidoId)
      .eq('cliente_id', clienteId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar pedido:', error)
      return {
        pedido: null,
        error,
      }
    }

    // Se tem unidade_id mas não retornou unidade, busca separadamente
    if (data?.unidade_id && !data?.unidade) {
      console.log('⚠️ [buscarPedidoCliente] Pedido tem unidade_id mas unidade não retornou, buscando separadamente...', {
        unidadeId: data.unidade_id,
      })
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidades_revenda')
        .select('id, nome, nome_publico, link_publico, link_publico_ativo')
        .eq('id', data.unidade_id)
        .maybeSingle()
      
      if (!unidadeError && unidadeData) {
        console.log('✅ [buscarPedidoCliente] Unidade encontrada separadamente:', unidadeData)
        data.unidade = unidadeData
      } else {
        console.error('❌ [buscarPedidoCliente] Erro ao buscar unidade separadamente:', unidadeError)
      }
    }

    // Processa parcelamento
    if (data?.parcelamento) {
      const parcelamentoRaw = Array.isArray(data.parcelamento)
        ? data.parcelamento[0]
        : data.parcelamento

      let parcelasArray = []
      if (parcelamentoRaw?.parcelas) {
        if (Array.isArray(parcelamentoRaw.parcelas)) {
          parcelasArray = parcelamentoRaw.parcelas
        } else {
          parcelasArray = [parcelamentoRaw.parcelas]
        }
      }

      data.parcelamento = {
        ...parcelamentoRaw,
        parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
      }
    } else if (data?.forma_pagamento === 'pix_parcelado') {
      // Se é parcelado mas não encontrou parcelamento, tenta buscar separadamente
      console.warn('⚠️ Parcelamento não encontrado na query principal (cliente), buscando separadamente...')
      const { data: parcelamentoSeparado, error: parcelamentoError } = await supabase
        .from('parcelamentos')
        .select(`
          id,
          pedido_id,
          total_parcelas,
          valor_total,
          valor_parcela,
          status,
          criado_em,
          atualizado_em,
          parcelas:parcelas (
            id,
            parcelamento_id,
            numero_parcela,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            pix_copia_cola,
            criado_em,
            atualizado_em
          )
        `)
        .eq('pedido_id', pedidoId)
        .maybeSingle()

      if (!parcelamentoError && parcelamentoSeparado) {
        let parcelasArray = []
        if (parcelamentoSeparado?.parcelas) {
          if (Array.isArray(parcelamentoSeparado.parcelas)) {
            parcelasArray = parcelamentoSeparado.parcelas
          } else {
            parcelasArray = [parcelamentoSeparado.parcelas]
          }
        }

        data.parcelamento = {
          ...parcelamentoSeparado,
          parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
        }
        console.log('✅ Parcelamento encontrado separadamente (cliente):', data.parcelamento)
      } else {
        console.error('❌ Erro ao buscar parcelamento separadamente (cliente):', parcelamentoError)
      }
    }

    console.log('📦 [buscarPedidoCliente] Dados finais retornados:', {
      pedidoId,
      unidadeId: data?.unidade_id,
      unidade: data?.unidade,
      temUnidadeId: !!data?.unidade_id,
      temUnidadeObjeto: !!data?.unidade,
      revenda: data?.revenda?.nome_publico || data?.revenda?.nome_revenda,
    })

    return {
      pedido: data as Pedido,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar pedido:', error)
    return {
      pedido: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar pedido'),
    }
  }
}

/**
 * Busca um pedido de uma revenda
 */
export async function buscarPedidoRevenda(
  revendaId: string,
  pedidoId: string
): Promise<{ pedido: Pedido | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico,
          logo_url,
          descricao_loja,
          link_publico
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico,
          link_publico,
          link_publico_ativo
        ),
        cliente:usuarios!pedidos_cliente_id_fkey (
          id,
          nome_completo,
          email
        ),
        itens:itens_pedido (
          *,
          produto:produtos (
            id,
            nome,
            imagem_url
          )
        ),
        parcelamento:parcelamentos (
          *,
          parcelas:parcelas (*)
        ),
        endereco_entrega:enderecos_entrega!pedidos_endereco_entrega_id_fkey (*),
        agendamento_entrega:agendamentos_entrega!fk_pedidos_agendamento_entrega (*),
        transacao_financeira:transacoes_financeiras!transacoes_financeiras_pedido_id_fkey (
          id,
          valor_bruto,
          valor_liquido,
          taxa_percentual,
          taxa_fixa,
          modalidade,
          status,
          data_pagamento,
          data_repasse_prevista
        )
      `)
      .eq('id', pedidoId)
      .eq('revenda_id', revendaId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar pedido:', error)
      return {
        pedido: null,
        error,
      }
    }

    // Processa parcelamento - garante que seja sempre um objeto e parcelas seja array
    if (data?.parcelamento) {
      const parcelamentoRaw = Array.isArray(data.parcelamento)
        ? data.parcelamento[0]
        : data.parcelamento

      let parcelasArray = []
      if (parcelamentoRaw?.parcelas) {
        if (Array.isArray(parcelamentoRaw.parcelas)) {
          parcelasArray = parcelamentoRaw.parcelas
        } else {
          parcelasArray = [parcelamentoRaw.parcelas]
        }
      }

      data.parcelamento = {
        ...parcelamentoRaw,
        parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
      }
    } else if (data?.forma_pagamento === 'pix_parcelado') {
      // Se é parcelado mas não encontrou parcelamento, tenta buscar separadamente
      console.warn('⚠️ Parcelamento não encontrado na query principal, buscando separadamente...')
      const { data: parcelamentoSeparado, error: parcelamentoError } = await supabase
        .from('parcelamentos')
        .select(`
          *,
          parcelas:parcelas (*)
        `)
        .eq('pedido_id', pedidoId)
        .maybeSingle()

      if (!parcelamentoError && parcelamentoSeparado) {
        let parcelasArray = []
        if (parcelamentoSeparado?.parcelas) {
          if (Array.isArray(parcelamentoSeparado.parcelas)) {
            parcelasArray = parcelamentoSeparado.parcelas
          } else {
            parcelasArray = [parcelamentoSeparado.parcelas]
          }
        }

        data.parcelamento = {
          ...parcelamentoSeparado,
          parcelas: parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
        }
        console.log('✅ Parcelamento encontrado separadamente:', data.parcelamento)
      } else {
        console.error('❌ Erro ao buscar parcelamento separadamente:', parcelamentoError)
      }
    }

    // Processa endereco_entrega - garante que seja sempre um objeto
    console.log('🔍 [buscarPedidoRevenda] Endereço ANTES do processamento:', {
      enderecoRaw: data?.endereco_entrega,
      isArray: Array.isArray(data?.endereco_entrega),
      tipoEntrega: data?.tipo_entrega,
      enderecoEntregaId: data?.endereco_entrega_id,
      dataKeys: data ? Object.keys(data) : null,
      hasEnderecoEntrega: 'endereco_entrega' in (data || {}),
    })
    
    if (data?.endereco_entrega) {
      if (Array.isArray(data.endereco_entrega)) {
        data.endereco_entrega = data.endereco_entrega[0] || null
        console.log('✅ [buscarPedidoRevenda] Endereço era array, convertido para objeto:', data.endereco_entrega)
      } else {
        console.log('✅ [buscarPedidoRevenda] Endereço já é objeto:', data.endereco_entrega)
      }
    } else if (data?.endereco_entrega_id) {
      console.warn('⚠️ [buscarPedidoRevenda] endereco_entrega_id existe mas endereco_entrega não foi carregado:', data.endereco_entrega_id)
      // Tenta buscar separadamente
      const { data: enderecoSeparado, error: enderecoError } = await supabase
        .from('enderecos_entrega')
        .select('*')
        .eq('id', data.endereco_entrega_id)
        .maybeSingle()
      
      if (!enderecoError && enderecoSeparado) {
        data.endereco_entrega = enderecoSeparado
        console.log('✅ [buscarPedidoRevenda] Endereço carregado separadamente:', data.endereco_entrega)
      } else {
        console.error('❌ [buscarPedidoRevenda] Erro ao buscar endereço separadamente:', {
          error: enderecoError,
          enderecoId: data.endereco_entrega_id,
          enderecoData: enderecoSeparado,
        })
      }
    }

    // Processa agendamento_entrega - garante que seja sempre um objeto
    console.log('🔍 [buscarPedidoRevenda] Agendamento ANTES do processamento:', {
      agendamentoRaw: data?.agendamento_entrega,
      isArray: Array.isArray(data?.agendamento_entrega),
      agendamentoEntregaId: data?.agendamento_entrega_id,
    })
    
    if (data?.agendamento_entrega) {
      if (Array.isArray(data.agendamento_entrega)) {
        data.agendamento_entrega = data.agendamento_entrega[0] || null
        console.log('✅ [buscarPedidoRevenda] Agendamento era array, convertido para objeto:', data.agendamento_entrega)
      } else {
        console.log('✅ [buscarPedidoRevenda] Agendamento já é objeto:', data.agendamento_entrega)
      }
    } else if (data?.agendamento_entrega_id) {
      console.warn('⚠️ [buscarPedidoRevenda] agendamento_entrega_id existe mas agendamento_entrega não foi carregado:', data.agendamento_entrega_id)
      // Tenta buscar separadamente
      const { data: agendamentoSeparado, error: agendamentoError } = await supabase
        .from('agendamentos_entrega')
        .select('*')
        .eq('id', data.agendamento_entrega_id)
        .maybeSingle()
      
      if (!agendamentoError && agendamentoSeparado) {
        data.agendamento_entrega = agendamentoSeparado
        console.log('✅ [buscarPedidoRevenda] Agendamento carregado separadamente:', data.agendamento_entrega)
      } else {
        console.error('❌ [buscarPedidoRevenda] Erro ao buscar agendamento separadamente:', agendamentoError)
      }
    }

    // Processa transacao_financeira - converte valores de string para número
    if (data?.transacao_financeira) {
      const transacaoRaw = Array.isArray(data.transacao_financeira)
        ? data.transacao_financeira[0]
        : data.transacao_financeira
      
      if (transacaoRaw) {
        data.transacao_financeira = {
          ...transacaoRaw,
          valor_bruto: typeof transacaoRaw.valor_bruto === 'string' 
            ? parseFloat(transacaoRaw.valor_bruto) 
            : (transacaoRaw.valor_bruto || 0),
          valor_liquido: typeof transacaoRaw.valor_liquido === 'string' 
            ? parseFloat(transacaoRaw.valor_liquido) 
            : (transacaoRaw.valor_liquido || 0),
          taxa_percentual: typeof transacaoRaw.taxa_percentual === 'string' 
            ? parseFloat(transacaoRaw.taxa_percentual) 
            : (transacaoRaw.taxa_percentual || 0),
          taxa_fixa: typeof transacaoRaw.taxa_fixa === 'string' 
            ? parseFloat(transacaoRaw.taxa_fixa) 
            : (transacaoRaw.taxa_fixa || 0),
        }
        console.log('✅ [buscarPedidoRevenda] Transação financeira processada:', data.transacao_financeira)
      }
    }

    console.log('📦 [buscarPedidoRevenda] Dados finais:', {
      pedidoId,
      tipoEntrega: data?.tipo_entrega,
      enderecoEntregaId: data?.endereco_entrega_id,
      temEndereco: !!data?.endereco_entrega,
      endereco: data?.endereco_entrega,
      agendamentoEntregaId: data?.agendamento_entrega_id,
      temAgendamento: !!data?.agendamento_entrega,
      agendamento: data?.agendamento_entrega,
    })

    return {
      pedido: data as Pedido,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar pedido:', error)
    return {
      pedido: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar pedido'),
    }
  }
}

/**
 * Atualiza o status de um pedido
 */
export async function atualizarStatusPedido(
  pedidoId: string,
  status: StatusPedido
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', pedidoId)

    if (error) {
      console.error('❌ Erro ao atualizar status do pedido:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar status',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar status:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar status'),
      mensagem: 'Erro inesperado ao atualizar status',
    }
  }
}

/**
 * Atualiza o status de um pedido (Revenda)
 */
export async function atualizarStatusPedidoRevenda(
  pedidoId: string,
  status: StatusPedido
): Promise<{ error: Error | null; mensagem?: string }> {
  return atualizarStatusPedido(pedidoId, status)
}

/**
 * Exclui um pedido (Revenda)
 * Exclui também os parcelamentos e parcelas associados (CASCADE)
 */
export async function excluirPedidoRevenda(
  revendaId: string,
  pedidoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verifica se o pedido pertence à revenda
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, revenda_id')
      .eq('id', pedidoId)
      .eq('revenda_id', revendaId)
      .single()

    if (pedidoError || !pedidoData) {
      return {
        error: pedidoError || new Error('Pedido não encontrado ou não pertence a esta revenda'),
        mensagem: 'Pedido não encontrado ou você não tem permissão para excluí-lo',
      }
    }

    // Exclui o pedido (CASCADE remove automaticamente parcelamentos e parcelas)
    const { error: deleteError } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId)
      .eq('revenda_id', revendaId)

    if (deleteError) {
      console.error('❌ Erro ao excluir pedido:', deleteError)
      return {
        error: deleteError,
        mensagem: traduzirErro(deleteError.message) || 'Erro ao excluir pedido',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao excluir pedido:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao excluir pedido'),
      mensagem: 'Erro inesperado ao excluir pedido',
    }
  }
}
