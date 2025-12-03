import { useState, useEffect } from 'react'
import { 
  Store, 
  Plus, 
  Search, 
  AlertCircle, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  MoreVertical,
  User,
  Lock,
  Edit,
  Trash2,
  Ban,
  Send,
  KeyRound,
  CreditCard,
  MapPin,
  Building2,
  Tag,
  Eye
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  listarRevendas, 
  buscarDetalhesRevenda, 
  criarRevenda,
  atualizarRevenda,
  excluirRevenda,
  enviarMagicLinkRevenda,
  enviarRedefinicaoSenhaRevenda,
  bloquearRevenda,
  type RevendaCompleta 
} from '@/lib/gerenciarRevenda'
import {
  buscarConfiguracaoRepasseAtiva,
  listarConfiguracoesRepasse,
  atualizarTaxasRepasse,
  type ConfiguracaoRepasse,
} from '@/lib/configuracoesRepasse'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'
import { DollarSign, QrCode, Copy, Check } from 'lucide-react'
import { formatarPreco } from '@/lib/utils'
import { listarUnidades, atualizarConfiguracaoFinanceiraUnidade, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  aplicarMascaraTelefone, 
  removerMascaraTelefone, 
  aplicarMascaraCPF, 
  removerMascaraCPF,
  aplicarMascaraCNPJ,
  removerMascaraCNPJ,
  aplicarMascaraCEP,
  removerMascaraCEP
} from '@/lib/mascaras'
import { VisualizarComoRevenda } from '@/components/admin/VisualizarComoRevenda'
import { AccordionItem } from '@/components/ui/accordion'

// Função auxiliar para processar texto de marcas em array
const processarMarcasTexto = (texto: string): string[] => {
  if (!texto || !texto.trim()) return []
  
  // Separa por vírgula, ponto e vírgula, ou quebra de linha
  const marcas = texto
    .split(/[,;\n]/)
    .map(m => m.trim())
    .filter(m => m.length > 0)
  
  return marcas
}

// Função auxiliar para converter array de marcas em texto
const converterMarcasParaTexto = (marcas: string[] | null | undefined): string => {
  if (!marcas || !Array.isArray(marcas) || marcas.length === 0) return ''
  
  // Remove prefixo "Outros:" se existir e junta com vírgula
  const marcasLimpas = marcas.map(m => m.startsWith('Outros:') ? m.replace('Outros:', '').trim() : m.trim())
  return marcasLimpas.join(', ')
}

export default function Revendas() {
  const [revendas, setRevendas] = useState<RevendaCompleta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  // Filtros avançados
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'banido' | 'email_pendente'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [revendaSelecionada, setRevendaSelecionada] = useState<RevendaCompleta | null>(null)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  
  // Estados para o slide de nova revenda
  const [sheetNovaRevendaAberto, setSheetNovaRevendaAberto] = useState(false)
  const [nomeRevenda, setNomeRevenda] = useState('')
  const [cnpjRevenda, setCnpjRevenda] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [cpfResponsavel, setCpfResponsavel] = useState('')
  const [telefoneRevenda, setTelefoneRevenda] = useState('')
  const [cepRevenda, setCepRevenda] = useState('')
  const [logradouroRevenda, setLogradouroRevenda] = useState('')
  const [numeroRevenda, setNumeroRevenda] = useState('')
  const [complementoRevenda, setComplementoRevenda] = useState('')
  const [bairroRevenda, setBairroRevenda] = useState('')
  const [cidadeRevenda, setCidadeRevenda] = useState('')
  const [estadoRevenda, setEstadoRevenda] = useState('')
  const [marcasTexto, setMarcasTexto] = useState('')
  const [emailRevenda, setEmailRevenda] = useState('')
  const [senhaRevenda, setSenhaRevenda] = useState('')
  const [confirmarSenhaRevenda, setConfirmarSenhaRevenda] = useState('')
  const [enviarMagicLinkRevenda, setEnviarMagicLinkRevenda] = useState(false)
  const [carregandoNovaRevenda, setCarregandoNovaRevenda] = useState(false)
  const [erroNovaRevenda, setErroNovaRevenda] = useState<string | null>(null)
  const [sucessoNovaRevenda, setSucessoNovaRevenda] = useState(false)
  
  // Estados para gerenciar revenda
  const [editandoRevenda, setEditandoRevenda] = useState(false)
  const [nomeRevendaEditado, setNomeRevendaEditado] = useState('')
  const [cnpjEditado, setCnpjEditado] = useState('')
  const [nomeResponsavelEditado, setNomeResponsavelEditado] = useState('')
  const [cpfResponsavelEditado, setCpfResponsavelEditado] = useState('')
  const [telefoneEditado, setTelefoneEditado] = useState('')
  const [cepEditado, setCepEditado] = useState('')
  const [logradouroEditado, setLogradouroEditado] = useState('')
  const [numeroEditado, setNumeroEditado] = useState('')
  const [complementoEditado, setComplementoEditado] = useState('')
  const [bairroEditado, setBairroEditado] = useState('')
  const [cidadeEditada, setCidadeEditada] = useState('')
  const [estadoEditado, setEstadoEditado] = useState('')
  const [marcasTextoEditado, setMarcasTextoEditado] = useState('')
  const [emailEditado, setEmailEditado] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [sucessoAcao, setSucessoAcao] = useState<string | null>(null)
  
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false)
  const [excluindoRevenda, setExcluindoRevenda] = useState(false)
  
  // Estados para configurações de repasse
  const [configuracoesRepasse, setConfiguracoesRepasse] = useState<ConfiguracaoRepasse[]>([])
  const [configuracaoAtiva, setConfiguracaoAtiva] = useState<ConfiguracaoRepasse | null>(null)
  const [editandoTaxas, setEditandoTaxas] = useState<string | null>(null) // ID da configuração sendo editada
  const [taxaPercentualEditada, setTaxaPercentualEditada] = useState('')
  const [taxaFixaEditada, setTaxaFixaEditada] = useState('')
  const [salvandoTaxas, setSalvandoTaxas] = useState(false)
  
  // Estado para visualização como revenda
  const [visualizarComoRevendaAberto, setVisualizarComoRevendaAberto] = useState(false)
  
  // Estados para banimento inline
  const [mostrarCamposBanimento, setMostrarCamposBanimento] = useState(false)
  const [tipoTempoBanimento, setTipoTempoBanimento] = useState<'horas' | 'dias'>('horas')
  const [tempoBanimento, setTempoBanimento] = useState<string>('1')
  const [banindoRevenda, setBanindoRevenda] = useState(false)
  
  // Estados para unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(false)
  const [editandoModalidadeUnidade, setEditandoModalidadeUnidade] = useState<string | null>(null)
  const [modalidadeUnidadeEditada, setModalidadeUnidadeEditada] = useState<'D+1' | 'D+15' | 'D+30' | null>(null)
  const [salvandoModalidadeUnidade, setSalvandoModalidadeUnidade] = useState(false)
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null)
  // Estados para taxas de repasse
  const [editandoTaxasUnidade, setEditandoTaxasUnidade] = useState<string | null>(null)
  const [taxaPercentualUnidadeEditada, setTaxaPercentualUnidadeEditada] = useState<string>('')
  const [taxaFixaUnidadeEditada, setTaxaFixaUnidadeEditada] = useState<string>('')
  const [salvandoTaxasUnidade, setSalvandoTaxasUnidade] = useState(false)
  // Estados para acordeão de modalidades
  const [modalidadesAbertas, setModalidadesAbertas] = useState<Set<string>>(new Set())
  const [modalidadesUnidadeAbertas, setModalidadesUnidadeAbertas] = useState<Record<string, Set<string>>>({})

  useEffect(() => {
    carregarRevendas()
  }, [])

  const carregarRevendas = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const { revendas: revendasData, error } = await listarRevendas()

      if (error) {
        setErro('Erro ao carregar revendas. Verifique se a tabela "revendas" foi criada no Supabase.')
        console.error('❌ Erro ao carregar revendas:', error)
        setCarregando(false)
        return
      }

      setRevendas(revendasData || [])
      setCarregando(false)
    } catch (error) {
      setErro('Erro inesperado ao carregar revendas.')
      console.error('❌ Erro inesperado ao carregar revendas:', error)
      setCarregando(false)
    }
  }

  const handleAbrirDetalhes = async (revendaId: string) => {
    setCarregandoDetalhes(true)
    setSheetAberto(true)
    setEditandoRevenda(false)
    setErroEdicao(null)
    setSucessoAcao(null)
    setEditandoTaxas(null)
    
    try {
      const [revendaResult, configuracoesResult, configuracaoAtivaResult, unidadesResult] = await Promise.all([
        buscarDetalhesRevenda(revendaId),
        listarConfiguracoesRepasse(revendaId),
        buscarConfiguracaoRepasseAtiva(revendaId),
        listarUnidades(revendaId),
      ])
      
      const { revenda, error } = revendaResult
      
      if (error || !revenda) {
        console.error('❌ Erro ao buscar detalhes:', error)
        setErroEdicao(error?.message || 'Não foi possível carregar os detalhes da revenda.')
        setRevendaSelecionada(null)
      } else {
        setRevendaSelecionada(revenda)
        // Carrega todos os campos de edição com os dados da revenda
        setNomeRevendaEditado(revenda.nome_revenda || '')
        setCnpjEditado(revenda.cnpj ? aplicarMascaraCNPJ(revenda.cnpj.replace(/\D/g, '')) : '')
        setNomeResponsavelEditado(revenda.nome_responsavel || '')
        setCpfResponsavelEditado(revenda.cpf_responsavel ? aplicarMascaraCPF(revenda.cpf_responsavel.replace(/\D/g, '')) : '')
        setTelefoneEditado(revenda.telefone ? aplicarMascaraTelefone(revenda.telefone.replace(/\D/g, '')) : '')
        setCepEditado(revenda.cep ? aplicarMascaraCEP(revenda.cep.replace(/\D/g, '')) : '')
        setLogradouroEditado(revenda.logradouro || '')
        setNumeroEditado(revenda.numero || '')
        setComplementoEditado(revenda.complemento || '')
        setBairroEditado(revenda.bairro || '')
        setCidadeEditada(revenda.cidade || '')
        setEstadoEditado(revenda.estado || '')
        
        // Converte marcas trabalhadas de array para texto
        setMarcasTextoEditado(converterMarcasParaTexto(revenda.marcas_trabalhadas))
        
        setEmailEditado(revenda.email || '')
        setErroEdicao(null)
      }

      // Carrega configurações de repasse
      if (configuracoesResult.configuracoes) {
        setConfiguracoesRepasse(configuracoesResult.configuracoes)
      }
      if (configuracaoAtivaResult.configuracao) {
        setConfiguracaoAtiva(configuracaoAtivaResult.configuracao)
      }
      
      // Carrega unidades
      if (unidadesResult.unidades) {
        setUnidades(unidadesResult.unidades)
      } else {
        setUnidades([])
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao abrir detalhes:', error)
      setErroEdicao('Erro inesperado ao carregar detalhes da revenda.')
      setRevendaSelecionada(null)
    } finally {
      setCarregandoDetalhes(false)
    }
  }

  const handleEditarTaxas = (configuracaoId: string) => {
    const config = configuracoesRepasse.find((c) => c.id === configuracaoId)
    if (config) {
      setEditandoTaxas(configuracaoId)
      setTaxaPercentualEditada(config.taxa_percentual.toString())
      // Converter reais para centavos para exibição no campo
      setTaxaFixaEditada((config.taxa_fixa * 100).toString())
    }
  }

  const handleSalvarTaxas = async (modalidade?: 'D+1' | 'D+15' | 'D+30') => {
    const configIdOuModalidade = editandoTaxas || modalidade
    if (!configIdOuModalidade || !revendaSelecionada) return

    const taxaPercentual = parseFloat(taxaPercentualEditada)
    const taxaFixaValor = parseFloat(taxaFixaEditada)

    if (isNaN(taxaPercentual) || taxaPercentual < 0 || taxaPercentual > 100) {
      setErroEdicao('Taxa percentual deve estar entre 0 e 100')
      return
    }

    if (isNaN(taxaFixaValor) || taxaFixaValor < 0) {
      setErroEdicao('Taxa fixa não pode ser negativa')
      return
    }

    // Se taxaFixaValor >= 1, assume que está em centavos e converte para reais
    // Se for < 1, assume que já está em reais
    const taxaFixa = taxaFixaValor >= 1 && taxaFixaValor < 1000 ? taxaFixaValor / 100 : taxaFixaValor

    setSalvandoTaxas(true)
    setErroEdicao(null)

    try {
      // Se editandoTaxas é uma modalidade (D+1, D+15, D+30), precisa criar ou atualizar a configuração
      if (['D+1', 'D+15', 'D+30'].includes(configIdOuModalidade)) {
        const modalidade = configIdOuModalidade as 'D+1' | 'D+15' | 'D+30'
        
        // Busca se já existe configuração para esta modalidade
        const configExistente = configuracoesRepasse.find((c) => c.modalidade === modalidade)
        
        if (configExistente) {
          // Atualiza configuração existente
          const { error, mensagem } = await atualizarTaxasRepasse(
            configExistente.id,
            taxaPercentual,
            taxaFixa
          )

          if (error) {
            setErroEdicao(mensagem || 'Erro ao atualizar taxas')
            setSalvandoTaxas(false)
            return
          }
        } else {
          // Cria nova configuração
          const { data, error } = await supabase
            .from('configuracoes_repasse_revenda')
            .insert({
              revenda_id: revendaSelecionada.id,
              modalidade: modalidade,
              taxa_percentual: taxaPercentual,
              taxa_fixa: taxaFixa,
              ativo: false, // Não ativa automaticamente
            })
            .select()
            .single()

          if (error) {
            setErroEdicao('Erro ao criar configuração')
            setSalvandoTaxas(false)
            return
          }
        }
      } else {
        // É um ID de configuração, atualiza normalmente
        const { error, mensagem } = await atualizarTaxasRepasse(
          configIdOuModalidade,
          taxaPercentual,
          taxaFixa
        )

        if (error) {
          setErroEdicao(mensagem || 'Erro ao atualizar taxas')
          setSalvandoTaxas(false)
          return
        }
      }

      setSucessoAcao('Taxas atualizadas com sucesso!')
      setEditandoTaxas(null)
      setTaxaPercentualEditada('')
      setTaxaFixaEditada('')
      
      // Recarrega configurações
      if (revendaSelecionada) {
        const [configuracoesResult, configuracaoAtivaResult] = await Promise.all([
          listarConfiguracoesRepasse(revendaSelecionada.id),
          buscarConfiguracaoRepasseAtiva(revendaSelecionada.id),
        ])
        if (configuracoesResult.configuracoes) {
          setConfiguracoesRepasse(configuracoesResult.configuracoes)
        }
        if (configuracaoAtivaResult.configuracao) {
          setConfiguracaoAtiva(configuracaoAtivaResult.configuracao)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar taxas:', error)
      setErroEdicao('Erro inesperado ao atualizar taxas')
    } finally {
      setSalvandoTaxas(false)
    }
  }

  const handleCancelarEdicaoTaxas = () => {
    setEditandoTaxas(null)
    setTaxaPercentualEditada('')
    setTaxaFixaEditada('')
    setErroEdicao(null)
  }

  const handleCopiarCampo = async (texto: string, campoId: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiadoCampo(campoId)
      toast.success('Copiado para a área de transferência!')
      setTimeout(() => setCopiadoCampo(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast.error('Erro ao copiar texto')
    }
  }

  const handleSalvarModalidadeUnidade = async (unidadeId: string) => {
    if (!modalidadeUnidadeEditada) {
      toast.error('Selecione uma modalidade')
      return
    }

    setSalvandoModalidadeUnidade(true)
    try {
      const { error } = await atualizarConfiguracaoFinanceiraUnidade(unidadeId, {
        modalidade_repasse: modalidadeUnidadeEditada,
      })

      if (error) {
        toast.error('Erro ao atualizar modalidade da unidade')
        console.error('Erro:', error)
        return
      }

      // Atualiza a lista de unidades
      if (revendaSelecionada) {
        const { unidades: unidadesAtualizadas } = await listarUnidades(revendaSelecionada.id)
        setUnidades(unidadesAtualizadas || [])
      }

      setEditandoModalidadeUnidade(null)
      setModalidadeUnidadeEditada(null)
      toast.success('Modalidade atualizada com sucesso!')
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao atualizar modalidade')
    } finally {
      setSalvandoModalidadeUnidade(false)
    }
  }

  const toggleModalidade = (modalidade: string) => {
    const novasAbertas = new Set(modalidadesAbertas)
    if (novasAbertas.has(modalidade)) {
      novasAbertas.delete(modalidade)
    } else {
      novasAbertas.add(modalidade)
    }
    setModalidadesAbertas(novasAbertas)
  }

  const toggleModalidadeUnidade = (unidadeId: string, modalidade: string) => {
    const novasAbertas = { ...modalidadesUnidadeAbertas }
    if (!novasAbertas[unidadeId]) {
      novasAbertas[unidadeId] = new Set()
    }
    const setUnidade = novasAbertas[unidadeId]
    if (setUnidade.has(modalidade)) {
      setUnidade.delete(modalidade)
    } else {
      setUnidade.add(modalidade)
    }
    setModalidadesUnidadeAbertas(novasAbertas)
  }

  // Função para obter taxas padrão conforme a modalidade
  const obterTaxasPadrao = (modalidade: 'D+1' | 'D+15' | 'D+30' | null): { percentual: number; fixa: number } => {
    switch (modalidade) {
      case 'D+1':
        return { percentual: 8.0, fixa: 0.5 }
      case 'D+15':
        return { percentual: 6.5, fixa: 0.5 }
      case 'D+30':
        return { percentual: 5.0, fixa: 0.5 }
      default:
        return { percentual: 8.0, fixa: 0.5 } // D+1 como padrão
    }
  }

  const handleSalvarTaxasUnidade = async (unidadeIdOuComModalidade: string) => {
    // Extrai o unidadeId (pode vir no formato "unidadeId-modalidade")
    const unidadeId = unidadeIdOuComModalidade.includes('-') 
      ? unidadeIdOuComModalidade.split('-').slice(0, -1).join('-')
      : unidadeIdOuComModalidade
    
    const unidade = unidades.find(u => u.id === unidadeId)
    if (!unidade) {
      toast.error('Unidade não encontrada')
      return
    }

    const taxaPercentualStr = taxaPercentualUnidadeEditada.trim()
    const taxaFixaStr = taxaFixaUnidadeEditada.trim()
    
    // Obtém as taxas padrão da modalidade para comparação
    const taxasPadrao = obterTaxasPadrao(unidade.modalidade_repasse || 'D+1')
    
    let taxaPercentual: number | null = null
    let taxaFixa: number | null = null

    // Processa taxa percentual
    if (taxaPercentualStr === '') {
      // Campo vazio = remove personalização, usa taxa da revenda
      taxaPercentual = null
    } else {
      const valor = parseFloat(taxaPercentualStr)
      if (isNaN(valor)) {
        toast.error('Taxa percentual deve ser um número válido')
        return
      }
      if (valor < 0 || valor > 100) {
        toast.error('Taxa percentual deve estar entre 0 e 100')
        return
      }
      // Sempre salva o valor digitado (mesmo que seja igual ao padrão)
      // Isso permite que o usuário "confirme" os valores padrão como personalizados
      taxaPercentual = valor
    }

    // Processa taxa fixa
    if (taxaFixaStr === '') {
      // Campo vazio = remove personalização, usa taxa da revenda
      taxaFixa = null
    } else {
      const valor = parseFloat(taxaFixaStr)
      if (isNaN(valor)) {
        toast.error('Taxa fixa deve ser um número válido')
        return
      }
      if (valor < 0) {
        toast.error('Taxa fixa não pode ser negativa')
        return
      }
      // Sempre salva o valor digitado (mesmo que seja igual ao padrão)
      // Isso permite que o usuário "confirme" os valores padrão como personalizados
      taxaFixa = valor
    }

    console.log('💾 [handleSalvarTaxasUnidade] Salvando taxas:', {
      unidadeId,
      taxaPercentual,
      taxaFixa,
      valoresDigitados: { percentual: taxaPercentualStr, fixa: taxaFixaStr },
      taxasPadrao,
      valoresAtuais: {
        percentual: unidade.taxa_repasse_percentual,
        fixa: unidade.taxa_repasse_fixa,
      },
    })

    setSalvandoTaxasUnidade(true)
    try {
      const { error } = await atualizarConfiguracaoFinanceiraUnidade(unidadeId, {
        taxa_repasse_percentual: taxaPercentual,
        taxa_repasse_fixa: taxaFixa,
      })

      if (error) {
        const mensagemErro = error instanceof Error ? error.message : 'Erro ao atualizar taxas da unidade'
        toast.error(mensagemErro)
        console.error('❌ [handleSalvarTaxasUnidade] Erro completo:', error)
        return
      }

      console.log('✅ [handleSalvarTaxasUnidade] Taxas salvas com sucesso')

      // Atualiza a lista de unidades para refletir as mudanças
      if (revendaSelecionada) {
        const { unidades: unidadesAtualizadas, error: errorListar } = await listarUnidades(revendaSelecionada.id)
        if (errorListar) {
          console.error('❌ [handleSalvarTaxasUnidade] Erro ao recarregar unidades:', errorListar)
        } else {
          console.log('✅ [handleSalvarTaxasUnidade] Unidades recarregadas:', unidadesAtualizadas)
          setUnidades(unidadesAtualizadas || [])
          
          // Verifica se os valores foram salvos corretamente
          const unidadeAtualizada = unidadesAtualizadas?.find(u => u.id === unidadeId)
          if (unidadeAtualizada) {
            console.log('🔍 [handleSalvarTaxasUnidade] Unidade após salvar:', {
              id: unidadeAtualizada.id,
              taxa_repasse_percentual: unidadeAtualizada.taxa_repasse_percentual,
              taxa_repasse_fixa: unidadeAtualizada.taxa_repasse_fixa,
            })
          }
        }
      }

      setEditandoTaxasUnidade(null)
      setTaxaPercentualUnidadeEditada('')
      setTaxaFixaUnidadeEditada('')
      toast.success('Taxas atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao atualizar taxas')
    } finally {
      setSalvandoTaxasUnidade(false)
    }
  }

  const handleCadastrarNovaRevenda = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroNovaRevenda(null)

    if (senhaRevenda && senhaRevenda !== confirmarSenhaRevenda) {
      setErroNovaRevenda('As senhas não coincidem')
      return
    }

    if (senhaRevenda && senhaRevenda.length < 8) {
      setErroNovaRevenda('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (!nomeRevenda || !cnpjRevenda || !nomeResponsavel || !cpfResponsavel || !emailRevenda) {
      setErroNovaRevenda('Preencha todos os campos obrigatórios')
      return
    }

    // Validação: todos os campos de endereço são obrigatórios exceto complemento
    if (!cepRevenda || !logradouroRevenda || !numeroRevenda || !bairroRevenda || !cidadeRevenda || !estadoRevenda) {
      setErroNovaRevenda('Todos os campos de endereço são obrigatórios (CEP, Logradouro, Número, Bairro, Cidade e Estado). Apenas Complemento é opcional.')
      return
    }

    // Processa marcas trabalhadas do texto livre
    const marcasFinais = processarMarcasTexto(marcasTexto)

    setCarregandoNovaRevenda(true)

    try {
      const { error, mensagem, revenda } = await criarRevenda({
        nome_revenda: nomeRevenda,
        cnpj: cnpjRevenda,
        nome_responsavel: nomeResponsavel,
        cpf_responsavel: cpfResponsavel,
        telefone: telefoneRevenda || undefined,
        cep: cepRevenda,
        logradouro: logradouroRevenda,
        numero: numeroRevenda,
        complemento: complementoRevenda || undefined,
        bairro: bairroRevenda,
        cidade: cidadeRevenda,
        estado: estadoRevenda,
        marcas_trabalhadas: marcasFinais.length > 0 ? marcasFinais : undefined,
        email: emailRevenda,
        senha: senhaRevenda || undefined,
        enviar_magic_link: enviarMagicLinkRevenda,
      })

      if (error) {
        setErroNovaRevenda(mensagem || 'Erro ao criar revenda')
        setCarregandoNovaRevenda(false)
        return
      }

      setSucessoNovaRevenda(true)
      setCarregandoNovaRevenda(false)

      await carregarRevendas()

      setTimeout(() => {
        setSheetNovaRevendaAberto(false)
        setSucessoNovaRevenda(false)
        // Limpar todos os campos
        setNomeRevenda('')
        setCnpjRevenda('')
        setNomeResponsavel('')
        setCpfResponsavel('')
        setTelefoneRevenda('')
        setCepRevenda('')
        setLogradouroRevenda('')
        setNumeroRevenda('')
        setComplementoRevenda('')
        setBairroRevenda('')
        setCidadeRevenda('')
        setEstadoRevenda('')
        setMarcasTexto('')
        setEmailRevenda('')
        setSenhaRevenda('')
        setConfirmarSenhaRevenda('')
        setEnviarMagicLinkRevenda(false)
      }, 2000)
    } catch (error) {
      setErroNovaRevenda('Erro ao cadastrar revenda.')
      setCarregandoNovaRevenda(false)
    }
  }

  const handleSalvarEdicao = async () => {
    if (!revendaSelecionada) return

    setErroEdicao(null)
    setSalvandoEdicao(true)

    try {
      // Processa marcas trabalhadas do texto livre
      const marcasFinais = processarMarcasTexto(marcasTextoEditado)

      const { error, mensagem } = await atualizarRevenda(revendaSelecionada.id, {
        nome_revenda: nomeRevendaEditado,
        cnpj: cnpjEditado,
        nome_responsavel: nomeResponsavelEditado,
        cpf_responsavel: cpfResponsavelEditado,
        telefone: telefoneEditado,
        cep: cepEditado,
        logradouro: logradouroEditado,
        numero: numeroEditado,
        complemento: complementoEditado,
        bairro: bairroEditado,
        cidade: cidadeEditada,
        estado: estadoEditado,
        marcas_trabalhadas: marcasFinais.length > 0 ? marcasFinais : undefined,
        email: emailEditado !== revendaSelecionada.email ? emailEditado : undefined,
      })

      if (error) {
        setErroEdicao(mensagem || 'Erro ao atualizar revenda')
        setSalvandoEdicao(false)
        return
      }

      setSucessoAcao('Revenda atualizada com sucesso!')
      setEditandoRevenda(false)
      setSalvandoEdicao(false)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await carregarRevendas()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { revenda, error: detalhesError } = await buscarDetalhesRevenda(revendaSelecionada.id)
      
      if (revenda && !detalhesError) {
        setRevendaSelecionada(revenda)
        // Atualiza todos os campos de edição com os dados atualizados
        setNomeRevendaEditado(revenda.nome_revenda || '')
        setCnpjEditado(revenda.cnpj ? aplicarMascaraCNPJ(revenda.cnpj.replace(/\D/g, '')) : '')
        setNomeResponsavelEditado(revenda.nome_responsavel || '')
        setCpfResponsavelEditado(revenda.cpf_responsavel ? aplicarMascaraCPF(revenda.cpf_responsavel.replace(/\D/g, '')) : '')
        setTelefoneEditado(revenda.telefone ? aplicarMascaraTelefone(revenda.telefone.replace(/\D/g, '')) : '')
        setCepEditado(revenda.cep ? aplicarMascaraCEP(revenda.cep.replace(/\D/g, '')) : '')
        setLogradouroEditado(revenda.logradouro || '')
        setNumeroEditado(revenda.numero || '')
        setComplementoEditado(revenda.complemento || '')
        setBairroEditado(revenda.bairro || '')
        setCidadeEditada(revenda.cidade || '')
        setEstadoEditado(revenda.estado || '')
        
        // Converte marcas trabalhadas de array para texto
        setMarcasTextoEditado(converterMarcasParaTexto(revenda.marcas_trabalhadas))
        
        setEmailEditado(revenda.email || '')
      }

      setTimeout(() => setSucessoAcao(null), 3000)
    } catch (error) {
      setErroEdicao('Erro inesperado ao atualizar revenda')
      setSalvandoEdicao(false)
    }
  }

  const handleEnviarMagicLink = async () => {
    if (!revendaSelecionada?.email) return

    setSucessoAcao(null)
    const { error, mensagem } = await enviarMagicLinkRevenda(revendaSelecionada.email)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao enviar magic link')
    } else {
      setSucessoAcao('Magic Link enviado com sucesso!')
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleEnviarRedefinicaoSenha = async () => {
    if (!revendaSelecionada?.email) return

    setSucessoAcao(null)
    const { error, mensagem } = await enviarRedefinicaoSenhaRevenda(revendaSelecionada.email)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao enviar email de redefinição')
    } else {
      setSucessoAcao('Email de redefinição de senha enviado com sucesso!')
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleExcluirRevenda = async () => {
    if (!revendaSelecionada) return
    setConfirmarExclusaoAberto(true)
  }

  const confirmarExclusao = async () => {
    if (!revendaSelecionada) return
    setExcluindoRevenda(true)
    setSucessoAcao(null)
    const { error, mensagem } = await excluirRevenda(revendaSelecionada.id)
    setExcluindoRevenda(false)
    setConfirmarExclusaoAberto(false)
    if (error) {
      setErroEdicao(mensagem || 'Erro ao excluir revenda')
    } else {
      setSucessoAcao('Revenda excluída com sucesso!')
      setSheetAberto(false)
      await carregarRevendas()
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleBanirRevenda = async () => {
    if (!revendaSelecionada) return

    const valor = parseInt(tempoBanimento)
    if (isNaN(valor) || valor <= 0) {
      setErroEdicao('Por favor, insira um valor válido maior que zero.')
      return
    }

    const tempoFinal = tipoTempoBanimento === 'horas' ? `${valor}h` : `${valor}d`

    setBanindoRevenda(true)
    setSucessoAcao(null)
    setErroEdicao(null)

    console.log('🔒 Banindo revenda com tempo:', tempoFinal)

    const { error, mensagem } = await bloquearRevenda(
      revendaSelecionada.id, 
      true, 
      tempoFinal
    )

    setBanindoRevenda(false)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao banir revenda')
      console.error('❌ Erro ao banir:', error)
    } else {
      let tempoTexto = ''
      if (tempoFinal.endsWith('h')) {
        tempoTexto = `por ${valor} ${valor === 1 ? 'hora' : 'horas'}`
      } else {
        tempoTexto = `por ${valor} ${valor === 1 ? 'dia' : 'dias'}`
      }
      setSucessoAcao(`Revenda banida ${tempoTexto} com sucesso!`)
      setMostrarCamposBanimento(false)
      setTempoBanimento('1')
      await carregarRevendas()
      const { revenda } = await buscarDetalhesRevenda(revendaSelecionada.id)
      if (revenda) setRevendaSelecionada(revenda)
      setTimeout(() => setSucessoAcao(null), 5000)
    }
  }

  const handleDesbanirRevenda = async () => {
    if (!revendaSelecionada) return

    setSucessoAcao(null)
    setErroEdicao(null)
    const { error, mensagem } = await bloquearRevenda(revendaSelecionada.id, false)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao desbanir revenda')
    } else {
      setSucessoAcao('Revenda desbanida com sucesso!')
      await carregarRevendas()
      const { revenda } = await buscarDetalhesRevenda(revendaSelecionada.id)
      if (revenda) setRevendaSelecionada(revenda)
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const revendasFiltradas = revendas.filter(revenda => {
    const termo = busca.trim().toLowerCase()
    const correspondeBusca =
      termo.length === 0 ||
      revenda.nome_revenda.toLowerCase().includes(termo) ||
      revenda.cnpj.replace(/\D/g, '').includes(busca.replace(/\D/g, '')) ||
      revenda.nome_responsavel.toLowerCase().includes(termo) ||
      (revenda.telefone || '').includes(busca) ||
      (revenda.email || '').toLowerCase().includes(termo) ||
      (revenda.cpf_responsavel || '').includes(busca.replace(/\D/g, ''))

    // Filtro por status
    const correspondeStatus = (() => {
      switch (statusFiltro) {
        case 'ativo':
          return !revenda.esta_banido && !!revenda.email_confirmado
        case 'email_pendente':
          return !revenda.email_confirmado && !revenda.esta_banido
        case 'banido':
          return revenda.esta_banido
        case 'todos':
        default:
          return true
      }
    })()

    const correspondeData = (() => {
      const createdAt = revenda.criado_em ? new Date(revenda.criado_em) : null
      if (!createdAt) return false

      const agora = new Date()
      const inicioHoje = new Date()
      inicioHoje.setHours(0, 0, 0, 0)

      if (dataFiltro === 'tudo') return true
      if (dataFiltro === 'hoje') return createdAt >= inicioHoje

      const diasNum = dataFiltro === '7' || dataFiltro === '15' || dataFiltro === '30' ? parseInt(dataFiltro, 10) : null
      if (diasNum) {
        const limite = new Date(agora)
        limite.setDate(limite.getDate() - diasNum)
        return createdAt >= limite
      }

      if (dataFiltro === 'personalizado') {
        if (!dataInicioPersonalizada && !dataFimPersonalizada) return true

        const inicio = dataInicioPersonalizada ? new Date(dataInicioPersonalizada) : null
        const fim = dataFimPersonalizada ? new Date(dataFimPersonalizada) : null
        if (inicio) inicio.setHours(0, 0, 0, 0)
        if (fim) fim.setHours(23, 59, 59, 999)

        if (inicio && fim) return createdAt >= inicio && createdAt <= fim
        if (inicio && !fim) return createdAt >= inicio
        if (!inicio && fim) return createdAt <= fim
        return true
      }

      return true
    })()

    return correspondeBusca && correspondeStatus && correspondeData
  })

  const formatarData = (data: string | null) => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatarEndereco = (revenda: RevendaCompleta) => {
    const partes = []
    if (revenda.logradouro) partes.push(revenda.logradouro)
    if (revenda.numero) partes.push(revenda.numero)
    if (revenda.complemento) partes.push(revenda.complemento)
    if (revenda.bairro) partes.push(revenda.bairro)
    if (revenda.cidade) partes.push(revenda.cidade)
    if (revenda.estado) partes.push(revenda.estado)
    if (revenda.cep) partes.push(`CEP: ${aplicarMascaraCEP(revenda.cep)}`)
    return partes.length > 0 ? partes.join(', ') : 'Não informado'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Store className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Revendas
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie todas as revendas cadastradas ({revendas.length} {revendas.length === 1 ? 'revenda' : 'revendas'})
          </p>
        </div>
        <Button
          onClick={() => setSheetNovaRevendaAberto(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Revenda
        </Button>
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Execute o SQL em supabase/migrations/009_create_revendas_table.sql no SQL Editor do Supabase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros Simplificados */}
      <FiltrosAvancados
        busca={busca}
        onBuscaChange={setBusca}
        statusFiltro={{
          value: statusFiltro,
          onChange: (v) => setStatusFiltro(v as any),
          options: [
            { value: 'todos', label: 'Todos' },
            { value: 'ativo', label: 'Em atividade' },
            { value: 'email_pendente', label: 'E-mail pendente' },
            { value: 'banido', label: 'Banidos' },
          ],
        }}
        dataFiltro={{
          value: dataFiltro,
          onChange: setDataFiltro,
          dataInicio: dataInicioPersonalizada,
          dataFim: dataFimPersonalizada,
          onDataInicioChange: setDataInicioPersonalizada,
          onDataFimChange: setDataFimPersonalizada,
        }}
        placeholderBusca="Buscar por nome, CNPJ, responsável, telefone ou e-mail..."
        onLimparFiltros={() => {
          setDataInicioPersonalizada('')
          setDataFimPersonalizada('')
          setDropdownCalendarioAberto(false)
        }}
      />

      {/* Lista de Revendas */}
      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : revendasFiltradas.length === 0 ? (
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Store className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {busca ? 'Nenhuma revenda encontrada' : 'Nenhuma revenda cadastrada'}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {busca
                    ? 'Tente buscar com outros termos'
                    : 'As revendas aparecerão aqui quando forem cadastradas'}
                </p>
              </div>
              {!busca && (
                <Button
                  onClick={() => setSheetNovaRevendaAberto(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Revenda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Nome da Revenda
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      CNPJ
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Responsável
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Telefone
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      E-mail
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Status
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {revendasFiltradas.map((revenda) => (
                    <tr
                      key={revenda.id}
                      className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex-shrink-0">
                            <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                              {revenda.nome_revenda}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-neutral-900 dark:text-neutral-50">
                          {revenda.cnpj ? aplicarMascaraCNPJ(revenda.cnpj.replace(/\D/g, '')) : 'Não informado'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-neutral-900 dark:text-neutral-50">
                          {revenda.nome_responsavel}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-900 dark:text-neutral-50">
                            {revenda.telefone ? aplicarMascaraTelefone(revenda.telefone) : 'Não informado'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-neutral-900 dark:text-neutral-50 truncate">
                          {revenda.email || 'Não informado'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          {revenda.esta_banido ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800">
                              <Ban className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">Banido</span>
                            </span>
                          ) : revenda.email_confirmado ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">Em Atividade</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800">
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">E-mail Pendente</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirDetalhes(revenda.id)}
                            className="text-neutral-700 dark:text-neutral-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 mr-2" />
                            Ações
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet de Detalhes */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Revenda</SheetTitle>
            <SheetDescription>
              Informações completas e opções de gerenciamento
            </SheetDescription>
          </SheetHeader>

          {carregandoDetalhes ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : revendaSelecionada && !erroEdicao ? (
            <div className="mt-6">
              {sucessoAcao && (
                <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">{sucessoAcao}</p>
                </div>
              )}

              {erroEdicao && (
                <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erroEdicao}</p>
                </div>
              )}

              <Tabs defaultValue="informacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
                  <TabsTrigger value="unidades">Unidades</TabsTrigger>
                </TabsList>

                <TabsContent value="informacoes" className="mt-6 space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Informações da Revenda
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <Store className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nome da Revenda</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {revendaSelecionada.nome_revenda}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">CNPJ</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nome do Responsável</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {revendaSelecionada.nome_responsavel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">CPF do Responsável</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Telefone</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">E-mail</p>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                              {revendaSelecionada.email || 'Não informado'}
                            </p>
                            {revendaSelecionada.email && revendaSelecionada.email_confirmado ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : revendaSelecionada.email ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                          {revendaSelecionada.email && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {revendaSelecionada.email_confirmado ? 'E-mail confirmado' : 'E-mail não confirmado'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Endereço Completo</p>
                          {revendaSelecionada.cep || revendaSelecionada.logradouro ? (
                            <div className="space-y-1">
                              {revendaSelecionada.logradouro && (
                                <p className="text-sm text-neutral-900 dark:text-neutral-50">
                                  <span className="font-medium">Logradouro:</span> {revendaSelecionada.logradouro}
                                  {revendaSelecionada.numero && `, ${revendaSelecionada.numero}`}
                                  {revendaSelecionada.complemento && ` - ${revendaSelecionada.complemento}`}
                                </p>
                              )}
                              {revendaSelecionada.bairro && (
                                <p className="text-sm text-neutral-900 dark:text-neutral-50">
                                  <span className="font-medium">Bairro:</span> {revendaSelecionada.bairro}
                                </p>
                              )}
                              {(revendaSelecionada.cidade || revendaSelecionada.estado) && (
                                <p className="text-sm text-neutral-900 dark:text-neutral-50">
                                  <span className="font-medium">Cidade/UF:</span> {revendaSelecionada.cidade || ''}{revendaSelecionada.cidade && revendaSelecionada.estado ? '/' : ''}{revendaSelecionada.estado || ''}
                                </p>
                              )}
                              {revendaSelecionada.cep && (
                                <p className="text-sm text-neutral-900 dark:text-neutral-50">
                                  <span className="font-medium">CEP:</span> {aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, ''))}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Não informado</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Marcas Trabalhadas</p>
                          {revendaSelecionada.marcas_trabalhadas && revendaSelecionada.marcas_trabalhadas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {revendaSelecionada.marcas_trabalhadas.map((marca, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                >
                                  {marca.startsWith('Outros:') ? marca.replace('Outros:', 'Outros') : marca}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Nenhuma marca cadastrada</p>
                          )}
                        </div>
                      </div>

                      {revendaSelecionada.esta_banido && (
                        <div className="flex items-start gap-3">
                          <Ban className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status de Banimento</p>
                            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white shadow-sm">
                                  🚫 BANIDA
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                {revendaSelecionada.banido_at && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      <span className="font-medium">Banida em:</span> {formatarData(revendaSelecionada.banido_at)}
                                    </span>
                                  </div>
                                )}
                                {revendaSelecionada.banido_ate && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      <span className="font-medium">
                                        {new Date(revendaSelecionada.banido_ate) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                          ? '⏳ Banimento permanente'
                                          : `Válido até: ${formatarData(revendaSelecionada.banido_ate)}`}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações de Conta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Informações de Conta
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Data de Cadastro</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(revendaSelecionada.criado_em)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Última Atualização</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(revendaSelecionada.atualizado_em)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">ID da Revenda</p>
                          <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                            {revendaSelecionada.id}
                          </p>
                        </div>
                      </div>

                      {revendaSelecionada.user_id && (
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">ID do Usuário</p>
                            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                              {revendaSelecionada.user_id}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Tipo do Usuário</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 capitalize">
                            Revenda
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gerenciar" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Editar Revenda
                    </h3>

                    {!editandoRevenda ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Nome da Revenda</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.nome_revenda}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">CNPJ</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Nome do Responsável</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.nome_responsavel}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">CPF do Responsável</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Telefone</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">E-mail</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {revendaSelecionada.email || 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">Endereço Completo</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {formatarEndereco(revendaSelecionada)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700 ml-2"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">Marcas Trabalhadas</p>
                            <div className="flex flex-wrap gap-2">
                              {revendaSelecionada.marcas_trabalhadas && revendaSelecionada.marcas_trabalhadas.length > 0 ? (
                                revendaSelecionada.marcas_trabalhadas.map((marca, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                  >
                                    {typeof marca === 'string' && marca.startsWith('Outros:') ? marca.replace('Outros:', 'Outros') : marca}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Nenhuma marca cadastrada</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoRevenda(true)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel.replace(/\D/g, '')) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone.replace(/\D/g, '')) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep.replace(/\D/g, '')) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700 ml-2"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomeRevendaEditado">Nome da Revenda *</Label>
                          <Input
                            id="nomeRevendaEditado"
                            value={nomeRevendaEditado}
                            onChange={(e) => setNomeRevendaEditado(e.target.value)}
                            disabled={salvandoEdicao}
                            placeholder="Nome da revenda"
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cnpjEditado">CNPJ *</Label>
                          <Input
                            id="cnpjEditado"
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={cnpjEditado}
                            onChange={(e) => {
                              const valorFormatado = aplicarMascaraCNPJ(e.target.value)
                              setCnpjEditado(valorFormatado)
                            }}
                            disabled={salvandoEdicao}
                            maxLength={18}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nomeResponsavelEditado">Nome do Responsável *</Label>
                          <Input
                            id="nomeResponsavelEditado"
                            value={nomeResponsavelEditado}
                            onChange={(e) => setNomeResponsavelEditado(e.target.value)}
                            disabled={salvandoEdicao}
                            placeholder="Nome completo do responsável"
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpfResponsavelEditado">CPF do Responsável *</Label>
                          <Input
                            id="cpfResponsavelEditado"
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpfResponsavelEditado}
                            onChange={(e) => {
                              const valorFormatado = aplicarMascaraCPF(e.target.value)
                              setCpfResponsavelEditado(valorFormatado)
                            }}
                            disabled={salvandoEdicao}
                            maxLength={14}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefoneEditado">Telefone</Label>
                          <Input
                            id="telefoneEditado"
                            type="tel"
                            placeholder="(00) 0-0000-0000"
                            value={telefoneEditado}
                            onChange={(e) => {
                              const valor = e.target.value
                              const apenasNumeros = valor.replace(/\D/g, '')
                              if (apenasNumeros.length <= 11) {
                                setTelefoneEditado(aplicarMascaraTelefone(valor))
                              }
                            }}
                            disabled={salvandoEdicao}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailEditado">E-mail</Label>
                          <Input
                            id="emailEditado"
                            type="email"
                            value={emailEditado}
                            onChange={(e) => setEmailEditado(e.target.value)}
                            disabled={salvandoEdicao}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        {/* Endereço */}
                        <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Endereço</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cepEditado">CEP</Label>
                              <Input
                                id="cepEditado"
                                type="text"
                                placeholder="00000-000"
                                value={cepEditado}
                                onChange={(e) => {
                                  const valorFormatado = aplicarMascaraCEP(e.target.value)
                                  setCepEditado(valorFormatado)
                                }}
                                disabled={salvandoEdicao}
                                maxLength={9}
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="estadoEditado">Estado (UF)</Label>
                              <Input
                                id="estadoEditado"
                                type="text"
                                placeholder="SP"
                                value={estadoEditado}
                                onChange={(e) => setEstadoEditado(e.target.value.toUpperCase().slice(0, 2))}
                                disabled={salvandoEdicao}
                                maxLength={2}
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="logradouroEditado">Logradouro</Label>
                            <Input
                              id="logradouroEditado"
                              value={logradouroEditado}
                              onChange={(e) => setLogradouroEditado(e.target.value)}
                              disabled={salvandoEdicao}
                              placeholder="Rua, Avenida, etc."
                              className="border-neutral-300 dark:border-neutral-700"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="numeroEditado">Número</Label>
                              <Input
                                id="numeroEditado"
                                value={numeroEditado}
                                onChange={(e) => setNumeroEditado(e.target.value)}
                                disabled={salvandoEdicao}
                                placeholder="123"
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="complementoEditado">Complemento</Label>
                              <Input
                                id="complementoEditado"
                                value={complementoEditado}
                                onChange={(e) => setComplementoEditado(e.target.value)}
                                disabled={salvandoEdicao}
                                placeholder="Apto, Sala, etc."
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="bairroEditado">Bairro</Label>
                              <Input
                                id="bairroEditado"
                                value={bairroEditado}
                                onChange={(e) => setBairroEditado(e.target.value)}
                                disabled={salvandoEdicao}
                                placeholder="Nome do bairro"
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cidadeEditada">Cidade</Label>
                              <Input
                                id="cidadeEditada"
                                value={cidadeEditada}
                                onChange={(e) => setCidadeEditada(e.target.value)}
                                disabled={salvandoEdicao}
                                placeholder="Nome da cidade"
                                className="border-neutral-300 dark:border-neutral-700"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Marcas Trabalhadas */}
                        <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="space-y-2">
                            <Label htmlFor="marcasTextoEditado">Marcas Trabalhadas</Label>
                            <Textarea
                              id="marcasTextoEditado"
                              value={marcasTextoEditado}
                              onChange={(e) => setMarcasTextoEditado(e.target.value)}
                              disabled={salvandoEdicao}
                              placeholder="Digite as marcas separadas por vírgula (ex: Marca A, Marca B, Marca C)"
                              rows={3}
                              className="border-neutral-300 dark:border-neutral-700"
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Você pode separar as marcas por vírgula, ponto e vírgula ou quebra de linha.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditandoRevenda(false)
                              if (revendaSelecionada) {
                                setNomeRevendaEditado(revendaSelecionada.nome_revenda)
                                setCnpjEditado(revendaSelecionada.cnpj ? aplicarMascaraCNPJ(revendaSelecionada.cnpj.replace(/\D/g, '')) : '')
                                setNomeResponsavelEditado(revendaSelecionada.nome_responsavel)
                                setCpfResponsavelEditado(revendaSelecionada.cpf_responsavel ? aplicarMascaraCPF(revendaSelecionada.cpf_responsavel) : '')
                                setTelefoneEditado(revendaSelecionada.telefone ? aplicarMascaraTelefone(revendaSelecionada.telefone) : '')
                                setCepEditado(revendaSelecionada.cep ? aplicarMascaraCEP(revendaSelecionada.cep) : '')
                                setLogradouroEditado(revendaSelecionada.logradouro || '')
                                setNumeroEditado(revendaSelecionada.numero || '')
                                setComplementoEditado(revendaSelecionada.complemento || '')
                                setBairroEditado(revendaSelecionada.bairro || '')
                                setCidadeEditada(revendaSelecionada.cidade || '')
                                setEstadoEditado(revendaSelecionada.estado || '')
                                setMarcasTextoEditado(converterMarcasParaTexto(revendaSelecionada.marcas_trabalhadas))
                                setEmailEditado(revendaSelecionada.email || '')
                                setErroEdicao(null)
                              }
                            }}
                            disabled={salvandoEdicao}
                            className="flex-1 border-neutral-300 dark:border-neutral-700"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSalvarEdicao}
                            disabled={salvandoEdicao}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            {salvandoEdicao ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Configurações de Modalidades de Repasse */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      Modalidades de Repasse
                    </h3>
                    <Card className="border-neutral-200 dark:border-neutral-800">
                      <CardContent className="p-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Configure as taxas para cada modalidade de repasse. As taxas configuradas serão aplicadas a novos pedidos.
                        </p>
                        <div className="space-y-2">
                          {(['D+1', 'D+15', 'D+30'] as const).map((modalidade) => {
                            const config = configuracoesRepasse.find((c) => c.modalidade === modalidade)
                            const isAtiva = configuracaoAtiva?.modalidade === modalidade
                            const estaAberto = modalidadesAbertas.has(modalidade)
                            const estaEditando = editandoTaxas === config?.id || editandoTaxas === modalidade
                            
                            // Taxas padrão se não houver configuração
                            const taxasPadrao = obterTaxasPadrao(modalidade)
                            const taxaPercentual = config?.taxa_percentual ?? taxasPadrao.percentual
                            const taxaFixa = config?.taxa_fixa ?? taxasPadrao.fixa

                            return (
                              <AccordionItem
                                key={modalidade}
                                titulo={
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                        {modalidade}
                                      </span>
                                      {isAtiva && (
                                        <Badge variant="default" className="bg-green-500 text-xs">
                                          Ativa
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                      <span>{taxaPercentual}%</span>
                                      <span>+</span>
                                      <span>{formatarPreco(taxaFixa)}</span>
                                    </div>
                                  </div>
                                }
                                conteudo={
                                  <div className="space-y-4 pt-2">
                                    {estaEditando ? (
                                      <div className="space-y-3">
                                        <div>
                                          <Label className="text-sm text-neutral-700 dark:text-neutral-300 mb-1 block">
                                            Taxa Percentual (%)
                                          </Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={taxaPercentualEditada}
                                            onChange={(e) => setTaxaPercentualEditada(e.target.value)}
                                            disabled={salvandoTaxas}
                                            placeholder="Ex: 8.00"
                                            className="h-9"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm text-neutral-700 dark:text-neutral-300 mb-1 block">
                                            Taxa Fixa (R$)
                                          </Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={taxaFixaEditada}
                                            onChange={(e) => setTaxaFixaEditada(e.target.value)}
                                            disabled={salvandoTaxas}
                                            placeholder="Ex: 0.50"
                                            className="h-9"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            onClick={() => handleSalvarTaxas(modalidade)}
                                            disabled={salvandoTaxas}
                                            size="sm"
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                                          >
                                            {salvandoTaxas ? (
                                              <>
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Salvando...
                                              </>
                                            ) : (
                                              'Salvar'
                                            )}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelarEdicaoTaxas}
                                            disabled={salvandoTaxas}
                                          >
                                            Cancelar
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Taxa Percentual</p>
                                            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                                              {taxaPercentual}%
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Taxa Fixa</p>
                                            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                                              {formatarPreco(taxaFixa)}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            if (config) {
                                              setEditandoTaxas(config.id)
                                              setTaxaPercentualEditada(config.taxa_percentual.toString())
                                              setTaxaFixaEditada(config.taxa_fixa.toString())
                                            } else {
                                              // Se não há configuração, cria uma nova
                                              setEditandoTaxas(modalidade) // Usa a modalidade como ID temporário
                                              setTaxaPercentualEditada(taxasPadrao.percentual.toString())
                                              setTaxaFixaEditada(taxasPadrao.fixa.toString())
                                            }
                                          }}
                                          className="w-full"
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Editar Taxas
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                }
                                aberto={estaAberto}
                                onToggle={() => toggleModalidade(modalidade)}
                              />
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      Ações Rápidas
                    </h3>

                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        onClick={handleEnviarMagicLink}
                        className="justify-start border-neutral-300 dark:border-neutral-700"
                        disabled={!revendaSelecionada.email}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Magic Link
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleEnviarRedefinicaoSenha}
                        className="justify-start border-neutral-300 dark:border-neutral-700"
                        disabled={!revendaSelecionada.email}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Enviar Redefinição de Senha
                      </Button>

                      {revendaSelecionada.esta_banido ? (
                        <>
                          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-2">
                            <div className="flex items-start gap-2">
                              <Ban className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-orange-900 dark:text-orange-50">
                                  Revenda Banida
                                </p>
                                {revendaSelecionada.banido_ate && (
                                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                    {revendaSelecionada.banido_ate && new Date(revendaSelecionada.banido_ate) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                      ? 'Banimento permanente'
                                      : `Banida até ${formatarData(revendaSelecionada.banido_ate)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleDesbanirRevenda}
                            className="w-full justify-start border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-white dark:bg-neutral-900 hover:bg-green-600 hover:text-white dark:hover:bg-green-600 dark:hover:text-white hover:border-green-600 dark:hover:border-green-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Desbanir Revenda
                          </button>
                        </>
                      ) : (
                        <>
                          {!mostrarCamposBanimento ? (
                            <button
                              onClick={() => setMostrarCamposBanimento(true)}
                              className="w-full justify-start border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 bg-white dark:bg-neutral-900 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white hover:border-orange-600 dark:hover:border-orange-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Banir Revenda
                            </button>
                          ) : (
                            <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-orange-900 dark:text-orange-50">
                                  Tempo de Banimento
                                </Label>
                                <button
                                  onClick={() => {
                                    setMostrarCamposBanimento(false)
                                    setTempoBanimento('1')
                                    setTipoTempoBanimento('horas')
                                  }}
                                  className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTipoTempoBanimento('horas')}
                                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    tipoTempoBanimento === 'horas'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white dark:bg-neutral-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                  }`}
                                >
                                  Horas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTipoTempoBanimento('dias')}
                                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    tipoTempoBanimento === 'dias'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white dark:bg-neutral-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                  }`}
                                >
                                  Dias
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder={`Ex: ${tipoTempoBanimento === 'horas' ? '24' : '7'}`}
                                  value={tempoBanimento}
                                  onChange={(e) => {
                                    const valor = e.target.value.replace(/\D/g, '')
                                    if (valor === '' || parseInt(valor) > 0) {
                                      setTempoBanimento(valor)
                                    }
                                  }}
                                  className="flex-1 border-orange-300 dark:border-orange-700 bg-white dark:bg-neutral-900"
                                />
                                <button
                                  onClick={handleBanirRevenda}
                                  disabled={banindoRevenda || !tempoBanimento || parseInt(tempoBanimento) <= 0}
                                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center"
                                >
                                  {banindoRevenda ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                      Banindo...
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Banir
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                A revenda será banida por {tempoBanimento || '...'} {tipoTempoBanimento === 'horas' ? (parseInt(tempoBanimento) === 1 ? 'hora' : 'horas') : (parseInt(tempoBanimento) === 1 ? 'dia' : 'dias')}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => {
                          if (revendaSelecionada?.user_id) {
                            setSheetAberto(false) // Fecha o slide
                            setVisualizarComoRevendaAberto(true)
                          }
                        }}
                        className="w-full justify-start border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-900 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center mb-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar como Revenda
                      </button>

                      <button
                        onClick={handleExcluirRevenda}
                        className="w-full justify-start border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Revenda
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="unidades" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center gap-2">
                        <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        Unidades da Revenda
                      </h3>
                      <Badge variant="secondary" className="text-sm">
                        {unidades.length} {unidades.length === 1 ? 'unidade' : 'unidades'}
                      </Badge>
                    </div>


                    {carregandoDetalhes ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : unidades.length === 0 ? (
                      <Card className="border-neutral-200 dark:border-neutral-800">
                        <CardContent className="py-12 text-center">
                          <Store className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                            Nenhuma unidade cadastrada
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Esta revenda ainda não possui unidades cadastradas.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {unidades.map((unidade) => (
                          <Card
                            key={unidade.id}
                            className={`border-neutral-200 dark:border-neutral-800 ${
                              unidade.ativo
                                ? 'border-green-300 dark:border-green-700'
                                : 'border-neutral-300 dark:border-neutral-700 opacity-75'
                            }`}
                          >
                            <CardContent className="p-5 space-y-4">
                              {/* Header da Unidade */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`p-2 rounded-lg ${
                                    unidade.ativo
                                      ? 'bg-violet-100 dark:bg-violet-900/30'
                                      : 'bg-neutral-100 dark:bg-neutral-800'
                                  }`}>
                                    <Store className={`w-5 h-5 ${
                                      unidade.ativo
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-neutral-400 dark:text-neutral-500'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                      {unidade.nome}
                                      {unidade.ativo ? (
                                        <Badge variant="default" className="bg-green-500 text-xs">
                                          Ativa
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          Inativa
                                        </Badge>
                                      )}
                                    </h4>
                                    {unidade.nome_publico && (
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                        {unidade.nome_publico}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Configurações Financeiras */}
                              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                {/* Conta PIX */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <QrCode className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                      Conta PIX
                                    </p>
                                  </div>
                                  {unidade.conta_pix_chave && unidade.conta_pix_nome_completo ? (
                                    <div className="pl-6 space-y-2">
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Nome Completo</p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => handleCopiarCampo(unidade.conta_pix_nome_completo, `nome-${unidade.id}`)}
                                          >
                                            {copiadoCampo === `nome-${unidade.id}` ? (
                                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                          {unidade.conta_pix_nome_completo}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className="text-xs text-neutral-500 dark:text-neutral-400">CPF/CNPJ</p>
                                          {unidade.conta_pix_cpf_cnpj && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-2"
                                              onClick={() => handleCopiarCampo(unidade.conta_pix_cpf_cnpj, `cpf-${unidade.id}`)}
                                            >
                                              {copiadoCampo === `cpf-${unidade.id}` ? (
                                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                              ) : (
                                                <Copy className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                          {unidade.conta_pix_cpf_cnpj ? (
                                            unidade.conta_pix_cpf_cnpj.length === 11
                                              ? aplicarMascaraCPF(unidade.conta_pix_cpf_cnpj)
                                              : aplicarMascaraCNPJ(unidade.conta_pix_cpf_cnpj)
                                          ) : 'Não informado'}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Chave PIX ({unidade.conta_pix_tipo || 'N/A'})
                                          </p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => handleCopiarCampo(unidade.conta_pix_chave, `chave-${unidade.id}`)}
                                          >
                                            {copiadoCampo === `chave-${unidade.id}` ? (
                                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 break-all">
                                          {unidade.conta_pix_chave}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pl-6">
                                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Conta PIX não cadastrada
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Modalidades de Repasse */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                      Modalidades de Repasse
                                    </p>
                                  </div>
                                  <div className="pl-6 space-y-2">
                                    {(['D+1', 'D+15', 'D+30'] as const).map((modalidade) => {
                                      const estaAberto = modalidadesUnidadeAbertas[unidade.id]?.has(modalidade) || false
                                      const modalidadeAtiva = unidade.modalidade_repasse === modalidade
                                      const taxasPadrao = obterTaxasPadrao(modalidade)
                                      const taxaPercentual = unidade.taxa_repasse_percentual !== null && unidade.taxa_repasse_percentual !== undefined
                                        ? unidade.taxa_repasse_percentual
                                        : taxasPadrao.percentual
                                      const taxaFixa = unidade.taxa_repasse_fixa !== null && unidade.taxa_repasse_fixa !== undefined
                                        ? unidade.taxa_repasse_fixa
                                        : taxasPadrao.fixa
                                      const estaEditandoTaxas = editandoTaxasUnidade === `${unidade.id}-${modalidade}`

                                      return (
                                        <AccordionItem
                                          key={modalidade}
                                          titulo={
                                            <div className="flex items-center justify-between w-full pr-4">
                                              <div className="flex items-center gap-2">
                                                {modalidadeAtiva && (
                                                  <Badge variant="default" className="bg-green-500 text-white text-xs font-medium">
                                                    Ativa
                                                  </Badge>
                                                )}
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm">
                                                  {modalidade}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                                <span>{taxaPercentual}%</span>
                                                <span>+</span>
                                                <span>{formatarPreco(taxaFixa)}</span>
                                              </div>
                                            </div>
                                          }
                                          conteudo={
                                            <div className="space-y-3 pt-2">
                                              {/* Seleção de Modalidade */}
                                              <div>
                                                <Label className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">
                                                  Definir como Modalidade Ativa
                                                </Label>
                                                {editandoModalidadeUnidade === unidade.id && modalidadeUnidadeEditada === modalidade ? (
                                                  <div className="space-y-2">
                                                    <SelectMenu
                                                      value={modalidadeUnidadeEditada || ''}
                                                      onChange={(value) => setModalidadeUnidadeEditada(value as 'D+1' | 'D+15' | 'D+30' | null)}
                                                      options={[
                                                        { value: '', label: 'Remover modalidade' },
                                                        { value: 'D+1', label: 'D+1' },
                                                        { value: 'D+15', label: 'D+15' },
                                                        { value: 'D+30', label: 'D+30' },
                                                      ]}
                                                      disabled={salvandoModalidadeUnidade}
                                                      className="w-full"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                      <Button
                                                        onClick={() => handleSalvarModalidadeUnidade(unidade.id)}
                                                        disabled={salvandoModalidadeUnidade}
                                                        size="sm"
                                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
                                                      >
                                                        {salvandoModalidadeUnidade ? (
                                                          <>
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                                            Salvando...
                                                          </>
                                                        ) : (
                                                          'Salvar'
                                                        )}
                                                      </Button>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditandoModalidadeUnidade(null)
                                                          setModalidadeUnidadeEditada(null)
                                                        }}
                                                        disabled={salvandoModalidadeUnidade}
                                                        className="text-xs"
                                                      >
                                                        Cancelar
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      setEditandoModalidadeUnidade(unidade.id)
                                                      setModalidadeUnidadeEditada(modalidade)
                                                    }}
                                                    className="w-full text-xs"
                                                  >
                                                    {modalidadeAtiva ? (
                                                      <>
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Esta é a modalidade ativa
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Edit className="w-3 h-3 mr-1" />
                                                        Definir como Ativa
                                                      </>
                                                    )}
                                                  </Button>
                                                )}
                                              </div>

                                              {/* Edição de Taxas */}
                                              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                                {estaEditandoTaxas ? (
                                                  <div className="space-y-2">
                                                    <div>
                                                      <Label className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">
                                                        Taxa Percentual (%)
                                                      </Label>
                                                      <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={taxaPercentualUnidadeEditada}
                                                        onChange={(e) => setTaxaPercentualUnidadeEditada(e.target.value)}
                                                        disabled={salvandoTaxasUnidade}
                                                        placeholder="Ex: 5.00"
                                                        className="h-8 text-sm"
                                                      />
                                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                        Deixe vazio para usar a taxa da configuração da revenda
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <Label className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">
                                                        Taxa Fixa (R$)
                                                      </Label>
                                                      <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={taxaFixaUnidadeEditada}
                                                        onChange={(e) => setTaxaFixaUnidadeEditada(e.target.value)}
                                                        disabled={salvandoTaxasUnidade}
                                                        placeholder="Ex: 0.50"
                                                        className="h-8 text-sm"
                                                      />
                                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                        Deixe vazio para usar a taxa da configuração da revenda
                                                      </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <Button
                                                        onClick={() => handleSalvarTaxasUnidade(`${unidade.id}-${modalidade}`)}
                                                        disabled={salvandoTaxasUnidade}
                                                        size="sm"
                                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
                                                      >
                                                        {salvandoTaxasUnidade ? (
                                                          <>
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                                            Salvando...
                                                          </>
                                                        ) : (
                                                          'Salvar'
                                                        )}
                                                      </Button>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditandoTaxasUnidade(null)
                                                          setTaxaPercentualUnidadeEditada('')
                                                          setTaxaFixaUnidadeEditada('')
                                                        }}
                                                        disabled={salvandoTaxasUnidade}
                                                        className="text-xs"
                                                      >
                                                        Cancelar
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <div>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Taxa Percentual</p>
                                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                          {taxaPercentual}%
                                                        </p>
                                                      </div>
                                                      <div>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Taxa Fixa</p>
                                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                          {formatarPreco(taxaFixa)}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setEditandoTaxasUnidade(`${unidade.id}-${modalidade}`)
                                                        if (unidade.taxa_repasse_percentual !== null && unidade.taxa_repasse_percentual !== undefined) {
                                                          setTaxaPercentualUnidadeEditada(unidade.taxa_repasse_percentual.toString())
                                                        } else {
                                                          setTaxaPercentualUnidadeEditada('')
                                                        }
                                                        if (unidade.taxa_repasse_fixa !== null && unidade.taxa_repasse_fixa !== undefined) {
                                                          setTaxaFixaUnidadeEditada(unidade.taxa_repasse_fixa.toString())
                                                        } else {
                                                          setTaxaFixaUnidadeEditada('')
                                                        }
                                                      }}
                                                      className="w-full text-xs"
                                                    >
                                                      <Edit className="w-3 h-3 mr-1" />
                                                      Editar Taxas Personalizadas
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          }
                                          aberto={estaAberto}
                                          onToggle={() => toggleModalidadeUnidade(unidade.id, modalidade)}
                                        />
                                      )
                                    })}
                                  </div>
                                </div>

                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="mt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                {erroEdicao || 'Não foi possível carregar os detalhes da revenda.'}
              </p>
              {erroEdicao && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Verifique o console do navegador para mais detalhes.
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSheetAberto(false)
                  setErroEdicao(null)
                }}
                className="mt-4"
              >
                Fechar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de Nova Revenda */}
      <Sheet open={sheetNovaRevendaAberto} onOpenChange={setSheetNovaRevendaAberto}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cadastrar Nova Revenda</SheetTitle>
            <SheetDescription>
              Preencha os dados para cadastrar uma nova revenda no sistema
            </SheetDescription>
          </SheetHeader>

          {sucessoNovaRevenda ? (
            <div className="mt-6 text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Revenda criada com sucesso!
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                A revenda <strong>{nomeRevenda}</strong> foi cadastrada e receberá um email para criar sua senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCadastrarNovaRevenda} className="mt-6 space-y-6">
              {erroNovaRevenda && (
                <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erroNovaRevenda}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeRevenda">Nome da Revenda *</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="nomeRevenda"
                      type="text"
                      placeholder="Nome da revenda"
                      value={nomeRevenda}
                      onChange={(e) => setNomeRevenda(e.target.value)}
                      required
                      disabled={carregandoNovaRevenda}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpjRevenda">CNPJ *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="cnpjRevenda"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpjRevenda}
                      onChange={(e) => {
                        const valorFormatado = aplicarMascaraCNPJ(e.target.value)
                        setCnpjRevenda(valorFormatado)
                      }}
                      required
                      disabled={carregandoNovaRevenda}
                      maxLength={18}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="nomeResponsavel"
                      type="text"
                      placeholder="Nome completo do responsável"
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      required
                      disabled={carregandoNovaRevenda}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfResponsavel">CPF do Responsável *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="cpfResponsavel"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpfResponsavel}
                      onChange={(e) => {
                        const valorFormatado = aplicarMascaraCPF(e.target.value)
                        setCpfResponsavel(valorFormatado)
                      }}
                      required
                      disabled={carregandoNovaRevenda}
                      maxLength={14}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneRevenda">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="telefoneRevenda"
                      type="tel"
                      placeholder="(00) 0-0000-0000"
                      value={telefoneRevenda}
                      onChange={(e) => {
                        const valor = e.target.value
                        const apenasNumeros = valor.replace(/\D/g, '')
                        if (apenasNumeros.length <= 11) {
                          setTelefoneRevenda(aplicarMascaraTelefone(valor))
                        }
                      }}
                      disabled={carregandoNovaRevenda}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Telefone com DDD (opcional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailRevenda">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="emailRevenda"
                      type="email"
                      placeholder="revenda@email.com"
                      value={emailRevenda}
                      onChange={(e) => setEmailRevenda(e.target.value)}
                      required
                      disabled={carregandoNovaRevenda}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Endereço Completo</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cepRevenda">CEP *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <Input
                          id="cepRevenda"
                          type="text"
                          placeholder="00000-000"
                          value={cepRevenda}
                          onChange={(e) => {
                            const valorFormatado = aplicarMascaraCEP(e.target.value)
                            setCepRevenda(valorFormatado)
                          }}
                          required
                          disabled={carregandoNovaRevenda}
                          maxLength={9}
                          className="pl-10 border-neutral-300 dark:border-neutral-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estadoRevenda">Estado (UF) *</Label>
                      <Input
                        id="estadoRevenda"
                        type="text"
                        placeholder="SP"
                        value={estadoRevenda}
                        onChange={(e) => setEstadoRevenda(e.target.value.toUpperCase().slice(0, 2))}
                        required
                        disabled={carregandoNovaRevenda}
                        maxLength={2}
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logradouroRevenda">Logradouro *</Label>
                    <Input
                      id="logradouroRevenda"
                      value={logradouroRevenda}
                      onChange={(e) => setLogradouroRevenda(e.target.value)}
                      required
                      disabled={carregandoNovaRevenda}
                      placeholder="Rua, Avenida, etc."
                      className="border-neutral-300 dark:border-neutral-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeroRevenda">Número *</Label>
                      <Input
                        id="numeroRevenda"
                        value={numeroRevenda}
                        onChange={(e) => setNumeroRevenda(e.target.value)}
                        required
                        disabled={carregandoNovaRevenda}
                        placeholder="123"
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complementoRevenda">Complemento</Label>
                      <Input
                        id="complementoRevenda"
                        value={complementoRevenda}
                        onChange={(e) => setComplementoRevenda(e.target.value)}
                        disabled={carregandoNovaRevenda}
                        placeholder="Apto, Sala, etc."
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairroRevenda">Bairro *</Label>
                      <Input
                        id="bairroRevenda"
                        value={bairroRevenda}
                        onChange={(e) => setBairroRevenda(e.target.value)}
                        required
                        disabled={carregandoNovaRevenda}
                        placeholder="Nome do bairro"
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cidadeRevenda">Cidade *</Label>
                      <Input
                        id="cidadeRevenda"
                        value={cidadeRevenda}
                        onChange={(e) => setCidadeRevenda(e.target.value)}
                        required
                        disabled={carregandoNovaRevenda}
                        placeholder="Nome da cidade"
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Marcas Trabalhadas */}
                <div className="space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                  <div className="space-y-2">
                    <Label htmlFor="marcasTexto">Marcas Trabalhadas</Label>
                    <Textarea
                      id="marcasTexto"
                      value={marcasTexto}
                      onChange={(e) => setMarcasTexto(e.target.value)}
                      disabled={carregandoNovaRevenda}
                      placeholder="Digite as marcas separadas por vírgula (ex: Marca A, Marca B, Marca C)"
                      rows={3}
                      className="border-neutral-300 dark:border-neutral-700"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Você pode separar as marcas por vírgula, ponto e vírgula ou quebra de linha.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enviarMagicLinkRevenda"
                      checked={enviarMagicLinkRevenda}
                      onChange={(e) => setEnviarMagicLinkRevenda(e.target.checked)}
                      disabled={carregandoNovaRevenda}
                      className="mt-1 w-4 h-4 text-violet-600 border-neutral-300 rounded focus:ring-violet-500 dark:border-neutral-700"
                    />
                    <div className="flex-1">
                      <Label htmlFor="enviarMagicLinkRevenda" className="text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer">
                        Enviar Magic Link ao invés de senha
                      </Label>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        Se marcado, a revenda receberá um link de login por e-mail ao invés de uma senha. Os campos de senha serão desabilitados.
                      </p>
                    </div>
                  </div>
                </div>

                {!enviarMagicLinkRevenda && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="senhaRevenda">Senha (Opcional)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <Input
                          id="senhaRevenda"
                          type="password"
                          placeholder="Deixe em branco para revenda criar senha via email"
                          value={senhaRevenda}
                          onChange={(e) => setSenhaRevenda(e.target.value)}
                          disabled={carregandoNovaRevenda || enviarMagicLinkRevenda}
                          minLength={8}
                          className="pl-10 border-neutral-300 dark:border-neutral-700"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Se deixar em branco, a revenda receberá um email para criar sua senha. Se preencher, use no mínimo 8 caracteres.
                      </p>
                    </div>

                    {senhaRevenda && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmarSenhaRevenda">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <Input
                            id="confirmarSenhaRevenda"
                            type="password"
                            placeholder="••••••••"
                            value={confirmarSenhaRevenda}
                            onChange={(e) => setConfirmarSenhaRevenda(e.target.value)}
                            disabled={carregandoNovaRevenda || enviarMagicLinkRevenda}
                            className={`pl-10 border-neutral-300 dark:border-neutral-700 ${
                              confirmarSenhaRevenda && senhaRevenda !== confirmarSenhaRevenda
                                ? 'border-red-300 dark:border-red-700'
                                : confirmarSenhaRevenda && senhaRevenda === confirmarSenhaRevenda
                                ? 'border-green-300 dark:border-green-700'
                                : ''
                            }`}
                          />
                        </div>
                        {confirmarSenhaRevenda && senhaRevenda !== confirmarSenhaRevenda && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            As senhas não coincidem
                          </p>
                        )}
                        {confirmarSenhaRevenda && senhaRevenda === confirmarSenhaRevenda && senhaRevenda && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Senhas coincidem
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSheetNovaRevendaAberto(false)
                    setNomeRevenda('')
                    setCnpjRevenda('')
                    setNomeResponsavel('')
                    setCpfResponsavel('')
                    setTelefoneRevenda('')
                    setCepRevenda('')
                    setLogradouroRevenda('')
                    setNumeroRevenda('')
                    setComplementoRevenda('')
                    setBairroRevenda('')
                    setCidadeRevenda('')
                    setEstadoRevenda('')
                    setMarcasTexto('')
                    setEmailRevenda('')
                    setSenhaRevenda('')
                    setConfirmarSenhaRevenda('')
                    setEnviarMagicLinkRevenda(false)
                    setErroNovaRevenda(null)
                  }}
                  disabled={carregandoNovaRevenda}
                  className="flex-1 border-neutral-300 dark:border-neutral-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    carregandoNovaRevenda || 
                    (senhaRevenda && (senhaRevenda !== confirmarSenhaRevenda || senhaRevenda.length < 8))
                  }
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                >
                  {carregandoNovaRevenda ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Cadastrando...
                    </>
                  ) : (
                    enviarMagicLinkRevenda ? 'Cadastrar e Enviar Magic Link' : 'Cadastrar Revenda'
                  )}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        aberto={confirmarExclusaoAberto}
        onOpenChange={setConfirmarExclusaoAberto}
        titulo="Confirmar exclusão"
        descricao="Esta ação não pode ser desfeita. A revenda e seus dados associados serão removidos."
      >
        <div className="space-y-3">
          {revendaSelecionada && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                Revenda: <strong className="font-medium">{revendaSelecionada.nome_revenda}</strong>
              </p>
            </div>
          )}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tem certeza que deseja excluir? Esta ação afetará o acesso da revenda.
          </p>
        </div>
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmarExclusaoAberto(false)}
            className="border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarExclusao}
            disabled={excluindoRevenda}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {excluindoRevenda ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>Confirmar exclusão</>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup de Visualização como Revenda */}
      {visualizarComoRevendaAberto && revendaSelecionada && revendaSelecionada.user_id && (
        <VisualizarComoRevenda
          revendaId={revendaSelecionada.id}
          revendaUserId={revendaSelecionada.user_id}
          revendaNome={revendaSelecionada.nome_revenda}
          onClose={() => setVisualizarComoRevendaAberto(false)}
        />
      )}
    </div>
  )
}

