import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Mail, Lock, Save, ArrowLeft, AlertCircle, CheckCircle2, Phone, CreditCard, Building2, MapPin, Tag, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { obterSessao, redefinirSenha } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { traduzirErro } from '@/lib/traduzirErro'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'
import { aplicarMascaraTelefone, removerMascaraTelefone, aplicarMascaraCPF, aplicarMascaraCNPJ, aplicarMascaraCEP } from '@/lib/mascaras'
import { buscarDetalhesRevenda, atualizarRevenda, type RevendaCompleta } from '@/lib/gerenciarRevenda'
import { obterRoleDeUsuario } from '@/lib/roles'
import { obterRevendaId } from '@/lib/impersonation'

export default function GerenciarContaRevenda() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<SupabaseUser | null>(null)
  const [revenda, setRevenda] = useState<RevendaCompleta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  
  // Estados do formulário - Dados da Revenda
  const [nomeRevenda, setNomeRevenda] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [cpfResponsavel, setCpfResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  
  // Estados do formulário - Endereço
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  
  const [marcasTexto, setMarcasTexto] = useState('')
  
  // Estados do formulário - Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false)

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

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const session = await obterSessao()
        
        if (!session || !session.user) {
          navigate('/login')
          return
        }

        const role = obterRoleDeUsuario(session.user)
        if (role !== 'revenda') {
          if (role === 'admin') {
            navigate('/admin/conta')
          } else {
            navigate('/cliente/conta')
          }
          return
        }

        setUsuario(session.user)
        setEmail(session.user.email || '')
        
        // Carrega telefone e CPF dos metadados
        const telefoneUsuario = session.user.phone || session.user.user_metadata?.telefone || ''
        setTelefone(telefoneUsuario ? aplicarMascaraTelefone(telefoneUsuario) : '')
        
        const cpfUsuario = session.user.user_metadata?.cpf || ''
        setCpfResponsavel(cpfUsuario ? aplicarMascaraCPF(cpfUsuario) : '')
        
        // Sincroniza telefone
        await sincronizarTelefone(session.user)
        
        // Busca dados da revenda usando buscarDetalhesRevenda
        // Usa obterRevendaId() que já trata colaboradores corretamente
        const revendaId = await obterRevendaId()
        
        if (!revendaId) {
          setErro('Nenhuma revenda cadastrada encontrada para sua conta. Entre em contato com o administrador.')
          setCarregando(false)
          return
        }

        const { revenda: revendaCompleta, error: detalhesError } = await buscarDetalhesRevenda(revendaId)
        
        if (detalhesError) {
          setErro(`Erro ao carregar detalhes: ${detalhesError.message}`)
          setCarregando(false)
          return
        }
        
        if (!revendaCompleta) {
          setErro('Dados da revenda não encontrados')
          setCarregando(false)
          return
        }

        setRevenda(revendaCompleta)
        setNomeRevenda(revendaCompleta.nome_revenda || '')
        setCnpj(revendaCompleta.cnpj ? aplicarMascaraCNPJ(revendaCompleta.cnpj.replace(/\D/g, '')) : '')
        setNomeResponsavel(revendaCompleta.nome_responsavel || '')
        setCpfResponsavel(revendaCompleta.cpf_responsavel ? aplicarMascaraCPF(revendaCompleta.cpf_responsavel.replace(/\D/g, '')) : '')
        setTelefone(revendaCompleta.telefone ? aplicarMascaraTelefone(revendaCompleta.telefone.replace(/\D/g, '')) : '')
        setCep(revendaCompleta.cep ? aplicarMascaraCEP(revendaCompleta.cep.replace(/\D/g, '')) : '')
        setLogradouro(revendaCompleta.logradouro || '')
        setNumero(revendaCompleta.numero || '')
        setComplemento(revendaCompleta.complemento || '')
        setBairro(revendaCompleta.bairro || '')
        setCidade(revendaCompleta.cidade || '')
        setEstado(revendaCompleta.estado || '')
        
        // Converte marcas trabalhadas de array para texto
        setMarcasTexto(converterMarcasParaTexto(revendaCompleta.marcas_trabalhadas))
        
        // Define email do usuário
        if (revendaCompleta.email) {
          setEmail(revendaCompleta.email)
        }
        
        setCarregando(false)
      } catch (error) {
        console.error('Erro inesperado ao carregar dados:', error)
        setErro('Erro ao carregar dados da conta. Tente recarregar a página.')
        setCarregando(false)
      }
    }

    carregarDados()
  }, [navigate])


  const handleAtualizarPerfil = async () => {
    if (!revenda) {
      setErro('Dados da revenda não encontrados')
      setSalvando(false)
      return
    }

    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      // Processa marcas trabalhadas do texto livre
      const marcasFinais = processarMarcasTexto(marcasTexto)

      const { error, mensagem } = await atualizarRevenda(revenda.id, {
        nome_revenda: nomeRevenda,
        nome_responsavel: nomeResponsavel,
        cpf_responsavel: cpfResponsavel,
        telefone: telefone,
        cep: cep,
        logradouro: logradouro,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
        marcas_trabalhadas: marcasFinais.length > 0 ? marcasFinais : undefined,
      })

      if (error) {
        setErro(mensagem || 'Erro ao atualizar perfil')
        setSalvando(false)
        return
      }

      // Atualiza também no auth.users se necessário
      const telefoneLimpo = telefone ? removerMascaraTelefone(telefone) : null
      const cpfLimpo = cpfResponsavel ? cpfResponsavel.replace(/\D/g, '') : null
      
      const updateData: any = {
        data: {
          nome_completo: nomeResponsavel,
          telefone: telefoneLimpo || null,
          cpf: cpfLimpo || null,
        },
      }

      const { error: updateError } = await supabase.auth.updateUser(updateData)

      if (updateError) {
        if (updateError.message && (updateError.message.includes('SMS provider') || updateError.message.includes('Unable to get SMS provider'))) {
          console.warn('⚠️ SMS provider não configurado, mas telefone foi salvo nos metadados')
        } else {
          console.error('Erro ao atualizar auth.users:', updateError)
        }
      }

      // Recarrega os dados atualizados
      if (revenda.id) {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { revenda: revendaAtualizada, error: detalhesError } = await buscarDetalhesRevenda(revenda.id)
        
        if (revendaAtualizada && !detalhesError) {
          setRevenda(revendaAtualizada)
          setNomeRevenda(revendaAtualizada.nome_revenda || '')
          setCnpj(revendaAtualizada.cnpj ? aplicarMascaraCNPJ(revendaAtualizada.cnpj.replace(/\D/g, '')) : '')
          setNomeResponsavel(revendaAtualizada.nome_responsavel || '')
          setCpfResponsavel(revendaAtualizada.cpf_responsavel ? aplicarMascaraCPF(revendaAtualizada.cpf_responsavel.replace(/\D/g, '')) : '')
          setTelefone(revendaAtualizada.telefone ? aplicarMascaraTelefone(revendaAtualizada.telefone.replace(/\D/g, '')) : '')
          setCep(revendaAtualizada.cep ? aplicarMascaraCEP(revendaAtualizada.cep.replace(/\D/g, '')) : '')
          setLogradouro(revendaAtualizada.logradouro || '')
          setNumero(revendaAtualizada.numero || '')
          setComplemento(revendaAtualizada.complemento || '')
          setBairro(revendaAtualizada.bairro || '')
          setCidade(revendaAtualizada.cidade || '')
          setEstado(revendaAtualizada.estado || '')
          
          // Processa marcas trabalhadas
          if (revendaAtualizada.marcas_trabalhadas && Array.isArray(revendaAtualizada.marcas_trabalhadas)) {
            const marcas = revendaAtualizada.marcas_trabalhadas
            const temOutros = marcas.some((m: string) => typeof m === 'string' && m.startsWith('Outros:'))
            if (temOutros) {
              const outrosItem = marcas.find((m: string) => typeof m === 'string' && m.startsWith('Outros:'))
              setMarcaOutrosTexto(outrosItem ? String(outrosItem).replace('Outros:', '') : '')
              setMarcasSelecionadas([...marcas.filter((m: string) => typeof m === 'string' && !m.startsWith('Outros:')), 'Outros'])
            } else {
              setMarcasSelecionadas(marcas)
              setMarcaOutrosTexto('')
            }
          } else {
            setMarcasSelecionadas([])
            setMarcaOutrosTexto('')
          }
        }
      }

      setSucesso('Perfil atualizado com sucesso!')
      setTimeout(() => setSucesso(null), 5000)
    } catch (error) {
      setErro('Erro inesperado ao atualizar perfil. Tente novamente.')
      setTimeout(() => setErro(null), 5000)
    } finally {
      setSalvando(false)
    }
  }

  const handleAlterarSenha = async () => {
    if (!usuario) return

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro('Preencha todos os campos de senha')
      setTimeout(() => setErro(null), 5000)
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      setTimeout(() => setErro(null), 5000)
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setTimeout(() => setErro(null), 5000)
      return
    }

    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      const { error } = await redefinirSenha(novaSenha)

      if (error) {
        throw error
      }

      setSucesso('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setMostrarAlterarSenha(false)
      setTimeout(() => setSucesso(null), 5000)
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      setErro(traduzirErro(error.message))
      setTimeout(() => setErro(null), 5000)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/revenda')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Gerenciar Revenda
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Atualize as informações da sua revenda
        </p>
      </div>

      {/* Mensagens de Erro/Sucesso */}
      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>
        </div>
      )}

      {/* Informações da Revenda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Informações da Revenda
          </CardTitle>
          <CardDescription>
            Atualize as informações da sua revenda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nomeRevenda">Nome da Revenda</Label>
              <Input
                id="nomeRevenda"
                value={nomeRevenda}
                onChange={(e) => setNomeRevenda(e.target.value)}
                placeholder="Nome da revenda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                disabled
                className="bg-neutral-100 dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                O CNPJ não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
              <Input
                id="nomeResponsavel"
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Nome completo do responsável"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfResponsavel">CPF do Responsável</Label>
              <Input
                id="cpfResponsavel"
                value={cpfResponsavel}
                onChange={(e) => {
                  const valor = e.target.value
                  setCpfResponsavel(aplicarMascaraCPF(valor))
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => {
                  const valor = e.target.value
                  setTelefone(aplicarMascaraTelefone(valor))
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-neutral-100 dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                O e-mail não pode ser alterado
              </p>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço Completo
            </h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => {
                    const valor = e.target.value
                    setCep(aplicarMascaraCEP(valor))
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="SP"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
            </div>
          </div>

          {/* Marcas Trabalhadas */}
          <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Marcas Trabalhadas
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="marcasTexto">Marcas Trabalhadas</Label>
              <Textarea
                id="marcasTexto"
                value={marcasTexto}
                onChange={(e) => setMarcasTexto(e.target.value)}
                placeholder="Digite as marcas separadas por vírgula (ex: Marca A, Marca B, Marca C)"
                rows={3}
                className="border-neutral-300 dark:border-neutral-700"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Você pode separar as marcas por vírgula, ponto e vírgula ou quebra de linha.
              </p>
            </div>
          </div>

          <Button
            onClick={handleAtualizarPerfil}
            disabled={salvando}
            className="w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mostrarAlterarSenha ? (
            <Button
              variant="outline"
              onClick={() => setMostrarAlterarSenha(true)}
            >
              Alterar Senha
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAlterarSenha}
                  disabled={salvando}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvando ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarAlterarSenha(false)
                    setSenhaAtual('')
                    setNovaSenha('')
                    setConfirmarSenha('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">ID do Usuário</span>
            <span className="text-sm font-mono text-neutral-900 dark:text-neutral-50">{usuario?.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">E-mail Confirmado</span>
            <span className={`text-sm font-medium ${usuario?.email_confirmed_at ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {usuario?.email_confirmed_at ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Tipo de Usuário</span>
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Revenda</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

