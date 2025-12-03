import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Calendar, Package, ArrowLeft, AlertCircle, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { listarCarrinho, limparCarrinho, atualizarQuantidadeCarrinho, removerDoCarrinho, type ItemCarrinho } from '@/lib/gerenciarCarrinho'
import { criarPedido, type FormaPagamento, type TipoEntrega } from '@/lib/gerenciarPedidos'
import { listarEnderecos, criarEndereco, type EnderecoEntrega } from '@/lib/gerenciarEnderecos'
import { formatarPreco, calcularValorParcelado } from '@/lib/utils'
import { aplicarMascaraTelefone, aplicarMascaraCPF, aplicarMascaraCEP, removerMascaraTelefone, removerMascaraCPF, removerMascaraCEP } from '@/lib/mascaras'
import { obterSessao } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { DatePicker } from '@/components/ui/date-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Calendar as CalendarIcon } from 'lucide-react'
import { buscarConfiguracaoAgendamento } from '@/lib/gerenciarAgendamentoEntrega'
import { CabecalhoRodapeLoja } from '@/components/loja/CabecalhoRodapeLoja'
import { buscarUnidade } from '@/lib/gerenciarUnidades'

export default function Checkout() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // Dados do carrinho
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [unidadeId, setUnidadeId] = useState<string | null>(null)
  const [produtosUnidadesDiferentes, setProdutosUnidadesDiferentes] = useState(false)
  
  // Dados do cliente
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  
  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix_vista')
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState<number>(2) // Padrão 2x
  
  // Tipo de entrega
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('retirar_local')
  const [queroAgendar, setQueroAgendar] = useState(false)
  
  // Opções de entrega da revenda
  const [opcoesEntrega, setOpcoesEntrega] = useState<{
    oferecer_entrega: boolean
    oferecer_retirada_local: boolean
    oferecer_agendamento: boolean
  }>({
    oferecer_entrega: true,
    oferecer_retirada_local: true,
    oferecer_agendamento: true,
  })
  
  // Reset agendamento quando muda tipo de entrega
  useEffect(() => {
    if (tipoEntrega !== 'receber_endereco') {
      setQueroAgendar(false)
      setDataAgendamento('')
      setHorarioAgendamento('09:00')
    }
  }, [tipoEntrega])
  
  // Ajusta tipo de entrega se a opção selecionada não estiver disponível
  useEffect(() => {
    if (revendaId && opcoesEntrega) {
      // Se retirada não está disponível e está selecionada, muda para entrega
      if (tipoEntrega === 'retirar_local' && !opcoesEntrega.oferecer_retirada_local && opcoesEntrega.oferecer_entrega) {
        setTipoEntrega('receber_endereco')
      }
      // Se entrega não está disponível e está selecionada, muda para retirada
      if (tipoEntrega === 'receber_endereco' && !opcoesEntrega.oferecer_entrega && opcoesEntrega.oferecer_retirada_local) {
        setTipoEntrega('retirar_local')
      }
    }
  }, [opcoesEntrega, revendaId, tipoEntrega])
  
  // Endereços
  const [enderecos, setEnderecos] = useState<EnderecoEntrega[]>([])
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>('novo')
  const [mostrarFormEndereco, setMostrarFormEndereco] = useState(false)
  
  // Novo endereço
  const [nomeEndereco, setNomeEndereco] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  
  // Agendamento
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horarioAgendamento, setHorarioAgendamento] = useState('09:00')
  const [dropdownData, setDropdownData] = useState(false)
  const [configuracaoAgendamento, setConfiguracaoAgendamento] = useState<{
    livre: boolean
    horariosDisponiveis: string[]
    diasDisponiveis?: number[]
  } | null>(null)
  
  // Observações
  const [observacoes, setObservacoes] = useState('')
  
  // Taxa de entrega
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0.00)
  

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    try {
      // Carrega carrinho
      const { itens: itensData, error: carrinhoError } = await listarCarrinho()
      if (carrinhoError || !itensData || itensData.length === 0) {
        navigate('/carrinho')
        return
      }

      setItens(itensData)
      
      // Verifica produtos e identifica unidades
      if (itensData[0]?.produto_id) {
        // Busca informações dos produtos (revenda_id e unidade_id)
        const produtosIds = itensData.map(item => item.produto_id)
        const { data: produtosData } = await supabase
          .from('produtos')
          .select('id, revenda_id, unidade_id')
          .in('id', produtosIds)
        
        if (produtosData && produtosData.length > 0) {
          const primeiroProduto = produtosData[0]
          setRevendaId(primeiroProduto.revenda_id)
          
          // Verifica se há produtos de unidades diferentes
          const unidadesIds = produtosData
            .map(p => p.unidade_id)
            .filter((id): id is string => id !== null && id !== undefined)
          
          const unidadesUnicas = [...new Set(unidadesIds)]
          
          let unidadeAtualId: string | null = null
          
          if (unidadesUnicas.length > 1) {
            // Há produtos de unidades diferentes - não permitir checkout
            setProdutosUnidadesDiferentes(true)
            setErro('Não é possível finalizar o pedido com produtos de unidades diferentes. Por favor, separe os produtos por unidade.')
            setUnidadeId(null)
            setCarregando(false)
            return
          } else if (unidadesUnicas.length === 1) {
            // Todos os produtos são da mesma unidade
            setProdutosUnidadesDiferentes(false)
            unidadeAtualId = unidadesUnicas[0]
            setUnidadeId(unidadesUnicas[0])
            console.log('✅ [Checkout] Unidade determinada pelos produtos:', unidadeAtualId)
          } else {
            // Produtos sem unidade (legado) - usa configurações da revenda
            setProdutosUnidadesDiferentes(false)
            setUnidadeId(null)
            console.log('⚠️ [Checkout] Produtos sem unidade_id (legado)')
          }
          
          // Carrega configurações da unidade ou revenda
          if (unidadeAtualId) {
            const { unidade, error: unidadeError } = await buscarUnidade(unidadeAtualId)
            
            console.log('🔍 [Checkout] Carregando configurações da unidade:', {
              unidadeId: unidadeAtualId,
              unidade,
              unidadeError,
              oferecer_entrega: unidade?.oferecer_entrega,
              oferecer_retirada_local: unidade?.oferecer_retirada_local,
              oferecer_agendamento: unidade?.oferecer_agendamento,
            })
            
            if (!unidadeError && unidade) {
              // Usa configurações da unidade
              // Usa os valores exatamente como vêm do banco (já são booleanos)
              const oferecerEntrega = unidade.oferecer_entrega === true
              const oferecerRetiradaLocal = unidade.oferecer_retirada_local === true
              const oferecerAgendamento = unidade.oferecer_agendamento === true
              
              console.log('✅ [Checkout] Configurações processadas:', {
                unidadeId: unidadeAtualId,
                nomeUnidade: unidade.nome,
                oferecerEntrega,
                oferecerRetiradaLocal,
                oferecerAgendamento,
                valoresOriginais: {
                  oferecer_entrega: unidade.oferecer_entrega,
                  oferecer_retirada_local: unidade.oferecer_retirada_local,
                  oferecer_agendamento: unidade.oferecer_agendamento,
                },
                tipos: {
                  oferecer_entrega: typeof unidade.oferecer_entrega,
                  oferecer_retirada_local: typeof unidade.oferecer_retirada_local,
                  oferecer_agendamento: typeof unidade.oferecer_agendamento,
                }
              })
              
              setTaxaEntrega(Number(unidade.taxa_entrega) || 0.00)
              setOpcoesEntrega({
                oferecer_entrega: oferecerEntrega,
                oferecer_retirada_local: oferecerRetiradaLocal,
                oferecer_agendamento: oferecerAgendamento,
              })
              
              // Carrega configuração de agendamento da unidade
              const { configuracao, error: configError } = await buscarConfiguracaoAgendamento(primeiroProduto.revenda_id, unidadeAtualId)
              console.log('🔍 [Checkout] Configuração de agendamento:', {
                revendaId: primeiroProduto.revenda_id,
                unidadeId: unidadeAtualId,
                configuracao,
                configError,
                oferecerAgendamento
              })
              
              if (configuracao) {
                setConfiguracaoAgendamento({
                  livre: configuracao.agendamento_entrega_livre,
                  horariosDisponiveis: configuracao.agendamento_horarios_disponiveis,
                  diasDisponiveis: configuracao.agendamento_dias_disponiveis,
                })
              } else if (oferecerAgendamento) {
                // Se a unidade oferece agendamento mas não há configuração, cria uma padrão
                console.log('⚠️ [Checkout] Unidade oferece agendamento mas não há configuração, usando padrão')
                setConfiguracaoAgendamento({
                  livre: true,
                  horariosDisponiveis: [],
                  diasDisponiveis: [0, 1, 2, 3, 4, 5, 6],
                })
              }
              
              // Define tipo de entrega padrão
              if (oferecerRetiradaLocal) {
                setTipoEntrega('retirar_local')
              } else if (oferecerEntrega) {
                setTipoEntrega('receber_endereco')
              }
            } else {
              console.error('❌ [Checkout] Erro ao carregar unidade:', unidadeError)
            }
          } else {
            // Produtos sem unidade - usa configurações da revenda (compatibilidade)
            const { data: revendaData } = await supabase
              .from('revendas')
              .select('taxa_entrega, oferecer_entrega, oferecer_retirada_local, oferecer_agendamento')
              .eq('id', primeiroProduto.revenda_id)
              .single()
            
            if (revendaData) {
              setTaxaEntrega(Number(revendaData.taxa_entrega) || 0.00)
              setOpcoesEntrega({
                oferecer_entrega: revendaData.oferecer_entrega ?? true,
                oferecer_retirada_local: revendaData.oferecer_retirada_local ?? true,
                oferecer_agendamento: revendaData.oferecer_agendamento ?? true,
              })
              
              // Carrega configuração de agendamento da revenda
              const { configuracao, error: configError } = await buscarConfiguracaoAgendamento(primeiroProduto.revenda_id)
              console.log('🔍 [Checkout] Configuração de agendamento (revenda):', {
                revendaId: primeiroProduto.revenda_id,
                configuracao,
                configError,
                oferecerAgendamento: revendaData.oferecer_agendamento
              })
              
              if (configuracao) {
                setConfiguracaoAgendamento({
                  livre: configuracao.agendamento_entrega_livre,
                  horariosDisponiveis: configuracao.agendamento_horarios_disponiveis,
                  diasDisponiveis: configuracao.agendamento_dias_disponiveis,
                })
              } else if (revendaData.oferecer_agendamento) {
                // Se a revenda oferece agendamento mas não há configuração, cria uma padrão
                console.log('⚠️ [Checkout] Revenda oferece agendamento mas não há configuração, usando padrão')
                setConfiguracaoAgendamento({
                  livre: true,
                  horariosDisponiveis: [],
                  diasDisponiveis: [0, 1, 2, 3, 4, 5, 6],
                })
              }
              
              // Define tipo de entrega padrão
              if (revendaData.oferecer_retirada_local) {
                setTipoEntrega('retirar_local')
              } else if (revendaData.oferecer_entrega) {
                setTipoEntrega('receber_endereco')
              }
            }
          }
        }
      }

      // Carrega dados do usuário se autenticado
      const session = await obterSessao()
      if (session?.user) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nome_completo, email, telefone, cpf')
          .eq('id', session.user.id)
          .single()
        
        if (usuarioData) {
          setNome(usuarioData.nome_completo || '')
          setEmail(usuarioData.email || '')
          if (usuarioData.telefone) {
            setTelefone(aplicarMascaraTelefone(usuarioData.telefone))
          }
          if (usuarioData.cpf) {
            setCpf(aplicarMascaraCPF(usuarioData.cpf))
          }
        }

        // Carrega endereços
        const { enderecos: enderecosData } = await listarEnderecos()
        if (enderecosData) {
          setEnderecos(enderecosData)
          if (enderecosData.length > 0) {
            setEnderecoSelecionado(enderecosData[0].id)
            setMostrarFormEndereco(false)
          } else {
            setEnderecoSelecionado('novo')
            setMostrarFormEndereco(true)
          }
        }
      } else {
        setMostrarFormEndereco(true)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setErro('Erro ao carregar dados do checkout')
    } finally {
      setCarregando(false)
    }
  }

  // Opções fixas de parcelamento da plataforma
  // 2x: Entrada da primeira parcela + última parcela em 15 dias
  // 3x: Entrada da primeira parcela + uma em 15 e outra em 30 dias
  const opcoesParcelamento = {
    opcoes: [2, 3], // Apenas 2x e 3x disponíveis
  }

  // Calcula valores
  const calcularSubtotal = () => {
    return itens.reduce((total, item) => {
      const preco = item.produto?.preco || 0
      return total + preco * item.quantidade
    }, 0)
  }

  // Funções para gerenciar carrinho
  const handleAtualizarQuantidade = async (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoverItem(itemId)
      return
    }

    setAtualizandoItem(itemId)
    try {
      const { error } = await atualizarQuantidadeCarrinho(itemId, novaQuantidade)
      if (error) {
        setErro('Erro ao atualizar quantidade')
        return
      }
      
      // Recarrega carrinho
      const { itens: novosItens } = await listarCarrinho()
      if (novosItens) {
        setItens(novosItens)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error)
      setErro('Erro ao atualizar quantidade')
    } finally {
      setAtualizandoItem(null)
    }
  }

  const handleRemoverItem = async (itemId: string) => {
    setAtualizandoItem(itemId)
    try {
      const { error } = await removerDoCarrinho(itemId)
      if (error) {
        setErro('Erro ao remover item')
        return
      }
      
      // Recarrega carrinho
      const { itens: novosItens } = await listarCarrinho()
      if (novosItens) {
        setItens(novosItens)
        if (novosItens.length === 0) {
          navigate('/carrinho')
        }
      }
    } catch (error) {
      console.error('❌ Erro ao remover item:', error)
      setErro('Erro ao remover item')
    } finally {
      setAtualizandoItem(null)
    }
  }

  const subtotal = calcularSubtotal()
  const valorTotal = subtotal + (tipoEntrega === 'receber_endereco' ? taxaEntrega : 0)
  const valorParcela = formaPagamento === 'pix_parcelado'
    ? valorTotal / parcelasSelecionadas
    : valorTotal

  // Função para calcular datas das parcelas
  const calcularDatasParcelas = () => {
    if (formaPagamento !== 'pix_parcelado') return []
    
    const hoje = new Date()
    const parcelas = []
    
    for (let i = 1; i <= parcelasSelecionadas; i++) {
      const dataVencimento = new Date(hoje)
      
      if (i === 1) {
        // Primeira parcela (entrada) - hoje
        dataVencimento.setDate(hoje.getDate())
      } else if (i === 2 && parcelasSelecionadas === 2) {
        // Segunda parcela em 2x - 15 dias
        dataVencimento.setDate(hoje.getDate() + 15)
      } else if (i === 2 && parcelasSelecionadas === 3) {
        // Segunda parcela em 3x - 15 dias
        dataVencimento.setDate(hoje.getDate() + 15)
      } else if (i === 3) {
        // Terceira parcela em 3x - 30 dias
        dataVencimento.setDate(hoje.getDate() + 30)
      }
      
      parcelas.push({
        numero: i,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: i === 1 ? 'entrada' : 'pendente'
      })
    }
    
    return parcelas
  }

  const simulacaoParcelas = calcularDatasParcelas()

  const handleSalvarEndereco = async () => {
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      setErro('Preencha todos os campos obrigatórios do endereço')
      return
    }

    const { endereco, error } = await criarEndereco({
      nome_endereco: nomeEndereco || null,
      cep: removerMascaraCEP(cep),
      logradouro,
      numero,
      complemento: complemento || null,
      bairro,
      cidade,
      estado,
    })

    if (error || !endereco) {
      setErro('Erro ao salvar endereço')
      return
    }

    setEnderecos([...enderecos, endereco])
    setEnderecoSelecionado(endereco.id)
    setMostrarFormEndereco(false)
    
    // Limpa formulário
    setNomeEndereco('')
    setCep('')
    setLogradouro('')
    setNumero('')
    setComplemento('')
    setBairro('')
    setCidade('')
    setEstado('')
  }

  const handleFinalizarPedido = async () => {
    setErro(null)

    // Verifica se o usuário está autenticado usando getSession diretamente
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const session = sessionData?.session
    
    console.log('🔍 Debug handleFinalizarPedido:', {
      temSessionData: !!sessionData,
      temSession: !!session,
      temUser: !!session?.user,
      userId: session?.user?.id,
      sessionError,
    })

    if (!session?.user) {
      setErro('É necessário estar autenticado para finalizar o pedido. Redirecionando para login...')
      setTimeout(() => {
        navigate('/login?redirect=/checkout')
      }, 2000)
      return
    }

    // Validações
    if (!nome.trim()) {
      setErro('Nome é obrigatório')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErro('Email válido é obrigatório')
      return
    }
    if (!telefone.trim()) {
      setErro('Telefone é obrigatório')
      return
    }
    if (tipoEntrega === 'receber_endereco') {
      // Valida endereço
      if (enderecos.length === 0 || enderecoSelecionado === 'novo' || mostrarFormEndereco) {
        // Se não tem endereços salvos OU está criando novo, precisa preencher formulário
        if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
          setErro('Preencha todos os campos do endereço')
          return
        }
      } else if (enderecoSelecionado && enderecoSelecionado !== 'novo') {
        // Endereço selecionado dos salvos - OK
      } else {
        setErro('Selecione ou cadastre um endereço para entrega')
        return
      }
      
      // Valida agendamento se marcado
      if (queroAgendar) {
        if (!dataAgendamento) {
          setErro('Selecione a data do agendamento')
          return
        }
        if (!horarioAgendamento) {
          setErro('Selecione o horário do agendamento')
          return
        }
      }
    }
    if (!revendaId) {
      setErro('Erro ao identificar a revenda')
      return
    }

    setSalvando(true)

    try {
      let enderecoId: string | null = null
      let agendamentoId: string | null = null

      // Salva endereço se necessário
      if (tipoEntrega === 'receber_endereco') {
        // Se não tem endereços salvos OU está criando novo endereço
        if (enderecos.length === 0 || enderecoSelecionado === 'novo' || mostrarFormEndereco) {
          const { endereco, error: enderecoError } = await criarEndereco({
            nome_endereco: nomeEndereco || null,
            cep: removerMascaraCEP(cep),
            logradouro,
            numero,
            complemento: complemento || null,
            bairro,
            cidade,
            estado,
          })
          
          if (enderecoError || !endereco) {
            setErro('Erro ao salvar endereço')
            setSalvando(false)
            return
          }
          
          enderecoId = endereco.id
        } else if (enderecoSelecionado && enderecoSelecionado !== 'novo') {
          // Usa endereço já salvo
          enderecoId = enderecoSelecionado
        } else {
          setErro('Selecione ou cadastre um endereço para entrega')
          setSalvando(false)
          return
        }
      }

      // Valida itens antes de criar pedido
      if (!itens || itens.length === 0) {
        setErro('O carrinho está vazio')
        setSalvando(false)
        return
      }

      // Prepara itens do pedido
      const itensPedido = itens.map(item => {
        const preco = item.produto?.preco || 0
        if (!preco || preco <= 0) {
          console.error('❌ Produto sem preço válido:', item.produto)
        }
        return {
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: preco,
        }
      }).filter(item => item.preco_unitario > 0) // Remove itens sem preço válido

      if (itensPedido.length === 0) {
        setErro('Nenhum item válido no carrinho. Verifique os preços dos produtos.')
        setSalvando(false)
        return
      }

      // Valida que todos os produtos são da mesma unidade
      const produtosIds = itensPedido.map(item => item.produto_id)
      const { data: produtosValidacao } = await supabase
        .from('produtos')
        .select('id, unidade_id')
        .in('id', produtosIds)
      
      if (produtosValidacao && produtosValidacao.length > 0) {
        const unidadesProdutos = produtosValidacao
          .map(p => p.unidade_id)
          .filter((id): id is string => id !== null && id !== undefined)
        
        const unidadesUnicas = [...new Set(unidadesProdutos)]
        
        if (unidadesUnicas.length > 1) {
          setErro('Não é possível finalizar o pedido com produtos de unidades diferentes. Por favor, separe os produtos por unidade.')
          setSalvando(false)
          return
        }
        
        // Se unidadeId não foi definido, usa a unidade dos produtos
        if (!unidadeId && unidadesUnicas.length === 1) {
          setUnidadeId(unidadesUnicas[0])
          console.log('✅ [Checkout] Unidade determinada pelos produtos na validação:', unidadesUnicas[0])
        }
        
        // Valida que unidadeId corresponde aos produtos
        if (unidadeId && unidadesUnicas.length === 1 && unidadesUnicas[0] !== unidadeId) {
          console.warn('⚠️ [Checkout] UnidadeId não corresponde aos produtos. Corrigindo...')
          setUnidadeId(unidadesUnicas[0])
        }
      }

      // Cria pedido PRIMEIRO (sem agendamento ainda)
      const { pedido, error: pedidoError } = await criarPedido({
        revenda_id: revendaId,
        unidade_id: unidadeId,
        forma_pagamento: formaPagamento,
        parcelas_total: formaPagamento === 'pix_parcelado' ? parcelasSelecionadas : null,
        dias_segunda_parcela: formaPagamento === 'pix_parcelado' && parcelasSelecionadas === 2 ? 15 : null, // 2x sempre em 15 dias
        taxa_entrega: tipoEntrega === 'receber_endereco' ? taxaEntrega : 0.00,
        tipo_entrega: tipoEntrega, // Sempre será 'receber_endereco' quando queroAgendar for true
        endereco_entrega_id: enderecoId,
        agendamento_entrega_id: null, // Será atualizado depois se necessário
        observacoes: observacoes || null,
        dados_cliente: {
          nome: nome.trim(),
          telefone: removerMascaraTelefone(telefone),
          email: email.trim(),
          cpf: cpf ? removerMascaraCPF(cpf) : undefined,
        },
        itens: itensPedido,
      })

      if (pedidoError || !pedido) {
        console.error('❌ Erro ao criar pedido no checkout:', pedidoError)
        console.error('❌ Dados enviados:', {
          revenda_id: revendaId,
        unidade_id: unidadeId,
          forma_pagamento: formaPagamento,
          parcelas_total: formaPagamento === 'pix_parcelado' ? parcelasSelecionadas : null,
          taxa_entrega: tipoEntrega === 'receber_endereco' ? taxaEntrega : 0.00,
          itens: itensPedido,
        })
        setErro(pedidoError?.message || 'Erro ao criar pedido. Verifique os dados e tente novamente.')
        setSalvando(false)
        return
      }

      // Cria agendamento DEPOIS do pedido (se necessário)
      // Agendamento só é criado se o cliente escolheu "Receber no Endereço" E marcou "Agendar entrega"
      if (tipoEntrega === 'receber_endereco' && queroAgendar && dataAgendamento && horarioAgendamento && revendaId && pedido.id) {
        const sessionAgendamento = await obterSessao()
        const clienteIdAgendamento = sessionAgendamento?.user?.id

        if (!clienteIdAgendamento) {
          setErro('É necessário estar autenticado para agendar entrega')
          setSalvando(false)
          return
        }

        const { data: agendamentoData, error: agendamentoError } = await supabase
          .from('agendamentos_entrega')
          .insert({
            pedido_id: pedido.id, // Agora temos o pedido_id
            revenda_id: revendaId,
            unidade_id: unidadeId || null, // Inclui unidade_id se disponível
            cliente_id: clienteIdAgendamento,
            data_agendamento: dataAgendamento,
            horario: horarioAgendamento, // Horário único simplificado
            horario_inicio: horarioAgendamento, // Mantém compatibilidade
            horario_fim: horarioAgendamento, // Mantém compatibilidade
            observacoes: observacoes || null,
          })
          .select()
          .single()

        if (agendamentoError || !agendamentoData) {
          console.error('❌ Erro ao criar agendamento:', agendamentoError)
          // Não falha o pedido, apenas loga o erro
          // O pedido já foi criado com sucesso
        } else {
          // Atualiza o pedido com o agendamento_id
          await supabase
            .from('pedidos')
            .update({ agendamento_entrega_id: agendamentoData.id })
            .eq('id', pedido.id)
        }
      }

      // Limpa carrinho
      await limparCarrinho()

      // Redireciona para confirmação
      navigate(`/pedido-confirmado/${pedido.id}`)
    } catch (error) {
      console.error('❌ Erro ao finalizar pedido:', error)
      setErro('Erro inesperado ao finalizar pedido')
      setSalvando(false)
    }
  }

  return (
    <CabecalhoRodapeLoja revendaId={revendaId} unidadeId={unidadeId}>
      {carregando ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-6xl mx-auto checkout-mobile">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/carrinho')}
          className="border-neutral-300 dark:border-neutral-700 w-full sm:w-auto min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Carrinho
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Checkout
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Finalize seu pedido
          </p>
        </div>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Dados do Cliente */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="border-neutral-300 dark:border-neutral-700 min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="border-neutral-300 dark:border-neutral-700 min-h-[44px] text-base"
                  />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm">Telefone *</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => {
                      const valor = e.target.value
                      const apenasNumeros = valor.replace(/\D/g, '')
                      if (apenasNumeros.length <= 11) {
                        setTelefone(aplicarMascaraTelefone(valor))
                      }
                    }}
                    placeholder="(00) 0-0000-0000"
                    className="border-neutral-300 dark:border-neutral-700 min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => {
                      const valorFormatado = aplicarMascaraCPF(e.target.value)
                      setCpf(valorFormatado)
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="border-neutral-300 dark:border-neutral-700 min-h-[44px] text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              {/* Mobile: Cards clicáveis | Desktop: Radio buttons */}
              <div className="lg:hidden space-y-2">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix_vista')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    formaPagamento === 'pix_vista'
                      ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-50">PIX à Vista</div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Pagamento completo no momento da compra
                      </div>
                    </div>
                    {formaPagamento === 'pix_vista' && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 dark:bg-violet-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix_parcelado')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    formaPagamento === 'pix_parcelado'
                      ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-50">PIX Parcelado</div>
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Parcelamento com primeira parcela como entrada
                      </div>
                    </div>
                    {formaPagamento === 'pix_parcelado' && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 dark:bg-violet-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
              {/* Desktop: Radio buttons */}
              <div className="hidden lg:block">
                <RadioGroup value={formaPagamento} onValueChange={(value) => setFormaPagamento(value as FormaPagamento)} className="space-y-3">
                  <label htmlFor="pix_vista" className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="pix_vista" id="pix_vista" className="mt-0.5 flex-shrink-0 !h-4 !w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">PIX à Vista</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                        Pagamento completo no momento da compra
                      </div>
                    </div>
                  </label>
                  <label htmlFor="pix_parcelado" className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="pix_parcelado" id="pix_parcelado" className="mt-0.5 flex-shrink-0 !h-4 !w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">PIX Parcelado</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                        Parcelamento com primeira parcela como entrada
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {formaPagamento === 'pix_parcelado' && (
                <div className="space-y-2 pl-6 border-l-2 border-violet-200 dark:border-violet-800">
                  <Label>Escolha o Parcelamento</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Opções disponíveis na plataforma:
                  </p>
                  <select
                    value={parcelasSelecionadas.toString()}
                    onChange={(e) => setParcelasSelecionadas(Number(e.target.value))}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                  >
                    <option value="2">
                      2x - Entrada + 15 dias
                    </option>
                    <option value="3">
                      3x - Entrada + 15 dias + 30 dias
                    </option>
                  </select>
                  
                  
                  {/* Simulação das Parcelas */}
                  {simulacaoParcelas.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">
                          Simulação das Parcelas
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {simulacaoParcelas.map((parcela) => {
                          const dataFormatada = new Date(parcela.dataVencimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                          
                          return (
                            <div
                              key={parcela.numero}
                              className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                  parcela.status === 'entrada'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                                }`}>
                                  {parcela.numero}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                    {parcela.status === 'entrada' ? 'Entrada' : `${parcela.numero}ª Parcela`}
                                  </div>
                                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Vencimento: {dataFormatada}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                  {formatarPreco(parcela.valor)}
                                </div>
                                {parcela.status === 'entrada' && (
                                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Paga hoje
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipo de Entrega */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              {/* Validação: pelo menos uma opção deve estar habilitada */}
              {!opcoesEntrega.oferecer_entrega && !opcoesEntrega.oferecer_retirada_local ? (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Nenhuma opção de entrega disponível no momento. Entre em contato com a loja.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile: Cards clicáveis | Desktop: Radio buttons */}
                  <div className="lg:hidden space-y-2">
                    {opcoesEntrega.oferecer_retirada_local && (
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('retirar_local')}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          tipoEntrega === 'retirar_local'
                            ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-50">Retirar no Local</div>
                            <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              Você retira o produto na loja
                            </div>
                          </div>
                          {tipoEntrega === 'retirar_local' && (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 dark:bg-violet-400 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )}
                    {opcoesEntrega.oferecer_entrega && (
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('receber_endereco')}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          tipoEntrega === 'receber_endereco'
                            ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-50 flex items-center justify-between">
                              <span>Receber no Endereço</span>
                              {taxaEntrega > 0 && (
                                <span className="text-xs font-normal text-violet-600 dark:text-violet-400 ml-2">
                                  + {formatarPreco(taxaEntrega)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              Entrega no endereço informado{taxaEntrega > 0 && ` (taxa: ${formatarPreco(taxaEntrega)})`}
                            </div>
                          </div>
                          {tipoEntrega === 'receber_endereco' && (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 dark:bg-violet-400 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                  {/* Desktop: Radio buttons */}
                  <div className="hidden lg:block">
                    <RadioGroup value={tipoEntrega} onValueChange={(value) => setTipoEntrega(value as TipoEntrega)} className="space-y-3">
                      {opcoesEntrega.oferecer_retirada_local && (
                        <label htmlFor="retirar_local" className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="retirar_local" id="retirar_local" className="mt-0.5 flex-shrink-0 !h-4 !w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base">Retirar no Local</div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                              Você retira o produto na loja
                            </div>
                          </div>
                        </label>
                      )}
                      {opcoesEntrega.oferecer_entrega && (
                        <label htmlFor="receber_endereco" className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="receber_endereco" id="receber_endereco" className="mt-0.5 flex-shrink-0 !h-4 !w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base flex items-center justify-between">
                              <span>Receber no Endereço</span>
                              {taxaEntrega > 0 && (
                                <span className="text-sm font-normal text-violet-600 dark:text-violet-400">
                                  + {formatarPreco(taxaEntrega)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                              Entrega no endereço informado{taxaEntrega > 0 && ` (taxa de entrega: ${formatarPreco(taxaEntrega)})`}
                            </div>
                          </div>
                        </label>
                      )}
                    </RadioGroup>
                  </div>
                </>
              )}

              {/* Formulário de Endereço */}
              {tipoEntrega === 'receber_endereco' && (
                <div className="space-y-4 pl-6 border-l-2 border-violet-200 dark:border-violet-800">
                  {/* Opção de Agendar */}
                  {opcoesEntrega.oferecer_agendamento && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
                      <input
                        type="checkbox"
                        id="queroAgendar"
                        checked={queroAgendar}
                        onChange={(e) => {
                          setQueroAgendar(e.target.checked)
                          if (!e.target.checked) {
                            setDataAgendamento('')
                            setHorarioAgendamento('09:00')
                          }
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 transition-colors"
                      />
                      <label htmlFor="queroAgendar" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          Agendar entrega
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                          Escolha data e horário para receber no endereço
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {/* Opções de Agendamento */}
                  {queroAgendar && (
                    <div className="space-y-4 p-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Data do Agendamento *</Label>
                          <Dropdown
                            aberto={dropdownData}
                            onToggle={setDropdownData}
                            alinhamento="inicio"
                            trigger={
                              <button
                                type="button"
                                className="inline-flex items-center justify-between gap-2 h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-neutral-500" />
                                  <span>
                                    {dataAgendamento
                                      ? new Date(dataAgendamento).toLocaleDateString('pt-BR')
                                      : 'Selecionar data'}
                                  </span>
                                </div>
                              </button>
                            }
                          >
                            <DatePicker
                              variant="compact"
                              data={dataAgendamento}
                              onChange={(data) => {
                                setDataAgendamento(data)
                                setDropdownData(false)
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              diasDisponiveis={configuracaoAgendamento?.diasDisponiveis}
                            />
                          </Dropdown>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="horarioAgendamento">Horário *</Label>
                          {configuracaoAgendamento && !configuracaoAgendamento.livre && configuracaoAgendamento.horariosDisponiveis.length > 0 ? (
                            <select
                              id="horarioAgendamento"
                              value={horarioAgendamento}
                              onChange={(e) => setHorarioAgendamento(e.target.value)}
                              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                            >
                              <option value="">Selecione um horário</option>
                              {configuracaoAgendamento.horariosDisponiveis.map((horario) => (
                                <option key={horario} value={horario}>
                                  {horario}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id="horarioAgendamento"
                              type="time"
                              value={horarioAgendamento}
                              onChange={(e) => setHorarioAgendamento(e.target.value)}
                              className="border-neutral-300 dark:border-neutral-700"
                            />
                          )}
                          {configuracaoAgendamento && !configuracaoAgendamento.livre && configuracaoAgendamento.horariosDisponiveis.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Selecione um dos horários disponíveis:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {configuracaoAgendamento.horariosDisponiveis.map((horario) => (
                                  <span
                                    key={horario}
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      horarioAgendamento === horario
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                    }`}
                                  >
                                    {horario}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {configuracaoAgendamento && configuracaoAgendamento.livre && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Escolha qualquer horário disponível
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {enderecos.length > 0 && !mostrarFormEndereco && (
                    <div className="space-y-2">
                      <Label>Selecione um endereço</Label>
                      <select
                        value={enderecoSelecionado}
                        onChange={(e) => {
                          setEnderecoSelecionado(e.target.value)
                          if (e.target.value === 'novo') {
                            setMostrarFormEndereco(true)
                          } else {
                            setMostrarFormEndereco(false)
                          }
                        }}
                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                      >
                        {enderecos.map((end) => (
                          <option key={end.id} value={end.id}>
                            {end.nome_endereco || `${end.logradouro}, ${end.numero}`}
                          </option>
                        ))}
                        <option value="novo">+ Novo Endereço</option>
                      </select>
                    </div>
                  )}

                  {(mostrarFormEndereco || enderecos.length === 0) && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nomeEndereco">Nome do Endereço (opcional)</Label>
                        <Input
                          id="nomeEndereco"
                          value={nomeEndereco}
                          onChange={(e) => setNomeEndereco(e.target.value)}
                          placeholder="Ex: Casa, Trabalho"
                          className="border-neutral-300 dark:border-neutral-700"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP *</Label>
                          <Input
                            id="cep"
                            value={cep}
                            onChange={(e) => {
                              const valorFormatado = aplicarMascaraCEP(e.target.value)
                              setCep(valorFormatado)
                            }}
                            placeholder="00000-000"
                            maxLength={9}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="logradouro">Logradouro *</Label>
                          <Input
                            id="logradouro"
                            value={logradouro}
                            onChange={(e) => setLogradouro(e.target.value)}
                            placeholder="Rua, Avenida, etc."
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            placeholder="123"
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="complemento">Complemento</Label>
                          <Input
                            id="complemento"
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                            placeholder="Apto, Bloco, etc."
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="bairro">Bairro *</Label>
                          <Input
                            id="bairro"
                            value={bairro}
                            onChange={(e) => setBairro(e.target.value)}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade *</Label>
                          <Input
                            id="cidade"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado *</Label>
                          <Input
                            id="estado"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                            placeholder="SP"
                            maxLength={2}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                      </div>
                      {enderecos.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSalvarEndereco}
                          className="w-full"
                        >
                          Salvar Endereço
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Alguma observação sobre o pedido? (opcional)"
                rows={4}
                className="border-neutral-300 dark:border-neutral-700"
              />
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <Card className="border-neutral-200 dark:border-neutral-800 sticky top-4">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                {itens.map((item) => {
                  const produto = item.produto
                  if (!produto) return null
                  const subtotal = produto.preco * item.quantidade
                  
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {produto.nome} x{item.quantidade}
                      </span>
                      <span className="font-medium">{formatarPreco(subtotal)}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 space-y-2">
                <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>{formatarPreco(subtotal)}</span>
                </div>
                {tipoEntrega === 'receber_endereco' && taxaEntrega > 0 && (
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Taxa de Entrega</span>
                    <span>{formatarPreco(taxaEntrega)}</span>
                  </div>
                )}
                {tipoEntrega !== 'receber_endereco' && (
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Frete</span>
                    <span className="text-green-600 dark:text-green-400">Grátis</span>
                  </div>
                )}
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2">
                  {formaPagamento === 'pix_parcelado' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {parcelasSelecionadas}x de
                        </span>
                        <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                          {formatarPreco(valorParcela)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">Total</span>
                        <span className="text-sm text-neutral-500 dark:text-neutral-500">
                          {formatarPreco(valorTotal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-50">Total</span>
                      <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(valorTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

                <Button
                  onClick={handleFinalizarPedido}
                  disabled={salvando}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Finalizar Pedido
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </div>
      )}
    </CabecalhoRodapeLoja>
  )
}

