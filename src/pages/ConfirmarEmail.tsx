import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/traduzirErro'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'
import { registrarIndicacao } from '@/lib/indicacoes'

export default function ConfirmarEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'verificando' | 'sucesso' | 'erro'>('verificando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const verificarEmail = async () => {
      try {
        // Aguarda um pouco para o Supabase processar o token automaticamente
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // O Supabase com detectSessionInUrl: true processa automaticamente os tokens
        // Verifica se há uma sessão após o processamento
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setStatus('erro')
          setMensagem(traduzirErro(sessionError) || 'Erro ao confirmar e-mail. O link pode ter expirado.')
          return
        }

        // Se há sessão, significa que o email foi confirmado
        if (session && session.user) {
          // Sincroniza o telefone dos metadados para o campo phone
          await sincronizarTelefone(session.user)
          
          // Processa indicação de amigo se houver código pendente
          // Busca os metadados atualizados após confirmação
          const { data: { user: userAtualizado } } = await supabase.auth.getUser()
          const codigoIndicacaoPendente = userAtualizado?.user_metadata?.codigo_indicacao_pendente
          
          console.log('📧 Email confirmado, verificando indicação:', { 
            userId: session.user.id, 
            codigoPendente: codigoIndicacaoPendente,
            metadados: session.user.user_metadata
          })
          
          if (codigoIndicacaoPendente) {
            try {
              console.log('🔗 Processando indicação pendente:', { userId: session.user.id, codigo: codigoIndicacaoPendente })
              
              // Aguarda o trigger criar o registro na tabela usuarios
              await new Promise(resolve => setTimeout(resolve, 1500))
              
              const resultado = await registrarIndicacao(session.user.id, codigoIndicacaoPendente)
              
              console.log('📊 Resultado do registro de indicação:', resultado)
              
              if (resultado.success) {
                console.log('✅ Indicação registrada com sucesso após confirmação de email')
                
                // Remove o código pendente dos metadados
                const { error: updateError } = await supabase.auth.updateUser({
                  data: {
                    codigo_indicacao_pendente: null,
                  },
                })
                
                if (updateError) {
                  console.warn('⚠️ Erro ao remover código pendente:', updateError)
                }
              } else {
                console.error('❌ Erro ao registrar indicação:', resultado.error)
              }
            } catch (indicacaoError) {
              console.error('❌ Erro ao processar indicação:', indicacaoError)
            }
          } else {
            console.log('ℹ️ Nenhum código de indicação pendente encontrado')
          }
          
          // Aguarda um pouco para garantir que a atualização foi processada
          await new Promise(resolve => setTimeout(resolve, 1000))

          setStatus('sucesso')
          setMensagem('E-mail confirmado com sucesso! Você já pode fazer login.')
          
          // Aguarda um pouco antes de fazer logout para garantir que a atualização foi processada
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Faz logout para que o usuário faça login novamente
          await supabase.auth.signOut()
          
          // Redireciona para login após 3 segundos
          setTimeout(() => {
            navigate('/login', {
              state: {
                mensagem: 'Conta confirmada! Você já pode fazer login.',
              },
            })
          }, 3000)
        } else {
          // Se não há sessão, verifica se há parâmetros na URL
          const tokenHash = searchParams.get('token_hash')
          const token = searchParams.get('token')
          const type = searchParams.get('type')

          if (tokenHash || token) {
            // Tenta verificar o token manualmente
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash || '',
              token: token || '',
              type: (type as any) || 'email',
            })

            if (error) {
              setStatus('erro')
              setMensagem(traduzirErro(error) || 'Erro ao confirmar e-mail. O link pode ter expirado.')
              return
            }

            if (data && data.user) {
              // Sincroniza o telefone dos metadados para o campo phone
              await sincronizarTelefone(data.user)
              
              // Processa indicação de amigo se houver código pendente
              // Busca os metadados atualizados após confirmação
              const { data: { user: userAtualizado } } = await supabase.auth.getUser()
              const codigoIndicacaoPendente = userAtualizado?.user_metadata?.codigo_indicacao_pendente
              
              console.log('📧 Email confirmado via OTP, verificando indicação:', { 
                userId: data.user.id, 
                codigoPendente: codigoIndicacaoPendente,
                metadados: data.user.user_metadata
              })
              
              if (codigoIndicacaoPendente) {
                try {
                  console.log('🔗 Processando indicação pendente:', { userId: data.user.id, codigo: codigoIndicacaoPendente })
                  
                  // Aguarda o trigger criar o registro na tabela usuarios
                  await new Promise(resolve => setTimeout(resolve, 1500))
                  
                  const resultado = await registrarIndicacao(data.user.id, codigoIndicacaoPendente)
                  
                  console.log('📊 Resultado do registro de indicação:', resultado)
                  
                  if (resultado.success) {
                    console.log('✅ Indicação registrada com sucesso após confirmação de email')
                    
                    // Remove o código pendente dos metadados
                    const { error: updateError } = await supabase.auth.updateUser({
                      data: {
                        codigo_indicacao_pendente: null,
                      },
                    })
                    
                    if (updateError) {
                      console.warn('⚠️ Erro ao remover código pendente:', updateError)
                    }
                  } else {
                    console.error('❌ Erro ao registrar indicação:', resultado.error)
                  }
                } catch (indicacaoError) {
                  console.error('❌ Erro ao processar indicação:', indicacaoError)
                }
              } else {
                console.log('ℹ️ Nenhum código de indicação pendente encontrado')
              }
              
              // Aguarda um pouco para garantir que a atualização foi processada
              await new Promise(resolve => setTimeout(resolve, 1000))

              setStatus('sucesso')
              setMensagem('E-mail confirmado com sucesso! Você já pode fazer login.')
              
              // Aguarda um pouco antes de fazer logout
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Faz logout para que o usuário faça login novamente
              await supabase.auth.signOut()
              
              setTimeout(() => {
                navigate('/login', {
                  state: {
                    mensagem: 'Conta confirmada! Você já pode fazer login.',
                  },
                })
              }, 3000)
            } else {
              setStatus('erro')
              setMensagem('Não foi possível confirmar o e-mail. Tente novamente.')
            }
          } else {
            // Sem parâmetros e sem sessão - pode ser acesso direto
            setStatus('erro')
            setMensagem('Link inválido ou expirado. Solicite um novo link de confirmação.')
          }
        }
      } catch (error) {
        setStatus('erro')
        setMensagem('Erro inesperado ao confirmar e-mail. Tente novamente.')
      }
    }

    verificarEmail()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12 animate-fade-in">
      <ThemeToggle />
      
      <div className="w-full max-w-md">
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardContent className="py-8">
            {status === 'verificando' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Verificando e-mail...
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Aguarde enquanto confirmamos sua conta.
                </p>
              </div>
            )}

            {status === 'sucesso' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  E-mail confirmado!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {mensagem}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2">
                  Redirecionando para o login...
                </p>
                <Button
                  onClick={() => navigate('/login', {
                    state: {
                      mensagem: 'Conta confirmada! Você já pode fazer login.',
                    },
                  })}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Ir para Login
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}

            {status === 'erro' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Erro ao confirmar
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {mensagem}
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Voltar para Login
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

