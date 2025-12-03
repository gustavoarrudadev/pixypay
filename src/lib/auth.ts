import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { traduzirErro } from './traduzirErro'

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: Error | null
  mensagemErro?: string
}

/**
 * Registra um novo usuário
 * Por padrão, usuários registrados pela tela de login são considerados "cliente"
 */
export async function registrarUsuario(
  email: string,
  senha: string,
  nome: string,
  telefone: string, // Agora obrigatório
  role: 'admin' | 'revenda' | 'cliente' = 'cliente',
  cpf?: string,
  codigoIndicacao?: string // Código de indicação opcional
): Promise<AuthResponse> {
  try {
    // Validações
    if (!telefone || telefone.trim().length < 10) {
      return {
        user: null,
        session: null,
        error: new Error('Telefone inválido'),
        mensagemErro: 'Telefone é obrigatório e deve ter pelo menos 10 dígitos (com DDD)',
      }
    }

    const telefoneLimpo = telefone.replace(/\D/g, '')
    
    console.log('📝 Dados para registro:', {
      email,
      nome,
      telefoneLimpo,
      cpf: cpf ? cpf.replace(/\D/g, '') : null,
      telefoneLength: telefoneLimpo.length
    })
    
    // Prepara os dados do usuário
    const userData: any = {
      email,
      password: senha,
      options: {
        data: {
          nome_completo: nome,
          role: role,
          display_name: nome, // Define o display_name nos metadados
          // Salva telefone nos metadados também para garantir que não seja perdido
          telefone: telefoneLimpo,
          // Salva CPF nos metadados
          cpf: cpf && cpf.trim().length > 0 ? cpf.replace(/\D/g, '') : null,
          // Salva código de indicação nos metadados para processar após confirmação de email
          codigo_indicacao_pendente: codigoIndicacao ? codigoIndicacao.toUpperCase().trim() : null,
        },
        emailRedirectTo: `${import.meta.env.VITE_APP_URL}/confirmar-email`,
      },
    }

    // NÃO adiciona phone diretamente no signUp - pode causar erro
    // O telefone será salvo apenas nos metadados e sincronizado depois
    console.log('📤 Enviando dados para Supabase:', {
      email: userData.email,
      hasPassword: !!userData.password,
      metadata: userData.options.data
    })

    const { data, error } = await supabase.auth.signUp(userData)

    if (error) {
      console.error('❌ Erro ao registrar usuário:', {
        message: error.message,
        status: error.status,
        error: error
      })
      return { 
        user: null, 
        session: null, 
        error,
        mensagemErro: traduzirErro(error)
      }
    }

    console.log('✅ Usuário criado com sucesso:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session
    })

    // Se o usuário foi criado com sucesso
    if (data.user) {
      // Tenta atualizar o telefone após criação usando uma abordagem diferente
      // Aguarda um pouco para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Tenta atualizar o phone usando a sessão temporária se disponível
      // Nota: Se não houver SMS provider configurado, apenas ignora o erro
      if (data.session) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            phone: telefoneLimpo,
          })

          if (updateError) {
            // Se o erro for relacionado a SMS provider, apenas ignora (telefone já está nos metadados)
            if (updateError.message && (updateError.message.includes('SMS provider') || updateError.message.includes('Unable to get SMS provider'))) {
              console.warn('⚠️ SMS provider não configurado. Telefone permanece apenas nos metadados.')
            } else {
              console.warn('Erro ao atualizar telefone após criação (não crítico):', updateError)
            }
            // O telefone já está salvo nos metadados, então não é crítico
          } else {
            console.log('Telefone atualizado com sucesso no registro')
          }
        } catch (updateErr) {
          // Se o erro for relacionado a SMS provider, apenas ignora
          if (updateErr instanceof Error && (updateErr.message.includes('SMS provider') || updateErr.message.includes('Unable to get SMS provider'))) {
            console.warn('⚠️ SMS provider não configurado. Telefone permanece apenas nos metadados.')
          } else {
            console.warn('Erro ao tentar atualizar telefone:', updateErr)
          }
          // Não falha o registro se o telefone não puder ser atualizado
        }
      } else {
        // Se não há sessão, o telefone será sincronizado após confirmação de email
        console.log('Telefone salvo nos metadados, será sincronizado após confirmação de email')
      }

      // Garante que o display_name está correto
      if (data.user.user_metadata?.display_name !== nome) {
        // Tenta atualizar mesmo sem sessão
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              nome_completo: nome,
              display_name: nome,
              role: role,
            },
          })

          if (updateError) {
            console.warn('Erro ao atualizar display_name (não crítico):', updateError)
          }
        } catch (updateErr) {
          console.warn('Erro ao tentar atualizar display_name:', updateErr)
        }
      }
    }

    // Código de indicação será processado após confirmação de email
    // Está salvo nos metadados do usuário como codigo_indicacao_pendente

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Erro inesperado ao registrar usuário:', error)
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
      mensagemErro: error instanceof Error ? traduzirErro(error) : 'Erro desconhecido ao criar conta. Tente novamente.',
    }
  }
}

/**
 * Faz login com email e senha
 * Verifica se o usuário está banido antes de tentar login
 */
export async function fazerLogin(
  email: string,
  senha: string
): Promise<AuthResponse> {
  try {
    // SEMPRE verificar se está banido ANTES de tentar login
    console.log('🔍 Verificando se usuário está banido:', email)
    const { data: banimentoData, error: banimentoError } = await supabase
      .rpc('verificar_usuario_banido', { user_email: email })
    
    console.log('📊 Resultado verificação banimento:', { banimentoData, banimentoError })
    
    // Se está banido, retorna erro IMEDIATAMENTE
    if (!banimentoError && banimentoData === true) {
      console.log('🚫 Usuário está BANIDO - bloqueando login')
      return {
        user: null,
        session: null,
        error: new Error('Conta suspensa'),
        mensagemErro: 'Sua conta está SUSPENSA, entre em contato com o suporte.'
      }
    }

    // Tenta fazer login
    console.log('✅ Usuário não está banido - tentando login')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      console.log('❌ Erro no login:', error.message)
      
      // Verificar se o erro é relacionado a banimento
      const errorMessage = error.message?.toLowerCase() || ''
      if (errorMessage.includes('banned') || 
          errorMessage.includes('suspended') || 
          errorMessage.includes('not authorized')) {
        console.log('🚫 Erro indica conta suspensa')
        return { 
          user: null, 
          session: null, 
          error,
          mensagemErro: 'Sua conta está SUSPENSA, entre em contato com o suporte.'
        }
      }
      
      return { 
        user: null, 
        session: null, 
        error,
        mensagemErro: traduzirErro(error)
      }
    }

    console.log('✅ Login realizado com sucesso')
    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('💥 Erro inesperado no login:', error)
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
      mensagemErro: 'Erro inesperado ao fazer login. Tente novamente.',
    }
  }
}

/**
 * Envia Magic Link para login sem senha (login rápido)
 * Verifica se o email existe antes de enviar (sem criar usuário)
 */
export async function enviarMagicLink(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Tenta enviar Magic Link diretamente
    // O Supabase retornará erro se o usuário não existir (dependendo da configuração)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Não cria usuário se não existir
        emailRedirectTo: `${import.meta.env.VITE_APP_URL}/magic-link-login`,
      },
    })

    if (error) {
      const mensagemErro = error.message.toLowerCase()
      
      // Verifica se é erro de usuário não encontrado ou signups não permitidos
      if (
        mensagemErro.includes('user not found') ||
        mensagemErro.includes('email not found') ||
        mensagemErro.includes('does not exist') ||
        mensagemErro.includes('signups not allowed for otp')
      ) {
        return {
          error,
          mensagem: 'Nenhuma conta encontrada com este e-mail. Faça o registro primeiro.',
        }
      }

      const mensagemTraduzida = traduzirErro(error)
      return { 
        error, 
        mensagem: mensagemTraduzida
      }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Erro ao enviar Magic Link'),
      mensagem: 'Erro inesperado ao enviar Magic Link. Tente novamente.',
    }
  }
}

/**
 * Verifica se um email existe no sistema
 */
export async function verificarEmailExisteNoSistema(email: string): Promise<{ existe: boolean; erro?: Error }> {
  try {
    const { data, error } = await supabase.rpc('verificar_email_existe', {
      user_email: email,
    })

    if (error) {
      console.error('❌ Erro ao verificar email:', error)
      return {
        existe: false,
        erro: error instanceof Error ? error : new Error('Erro ao verificar email'),
      }
    }

    return { existe: data === true }
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar email:', error)
    return {
      existe: false,
      erro: error instanceof Error ? error : new Error('Erro ao verificar email'),
    }
  }
}

/**
 * Envia email de recuperação de senha
 * Verifica se o email existe antes de enviar (sem criar usuário)
 */
export async function recuperarSenha(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('📧 Verificando se email existe antes de enviar recuperação:', email)
    
    // Primeiro verifica se o email existe
    const { existe, erro: erroVerificacao } = await verificarEmailExisteNoSistema(email)
    
    if (erroVerificacao) {
      console.error('❌ Erro ao verificar email:', erroVerificacao)
      // Continua mesmo com erro na verificação, tenta enviar mesmo assim
    } else if (!existe) {
      console.log('❌ Email não encontrado no sistema')
      return {
        error: new Error('Email não encontrado'),
        mensagem: 'Nenhuma conta encontrada com este e-mail. Verifique o e-mail ou faça o registro.',
      }
    }
    
    console.log('✅ Email existe, enviando recuperação de senha')
    
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const redirectTo = `${appUrl}/redefinir-senha`
    
    console.log('🔗 URL de redirecionamento:', redirectTo)
    
    // Envia email de recuperação
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    console.log('📊 Resultado resetPasswordForEmail:', { 
      temErro: !!error, 
      erro: error?.message,
      data: data
    })

    if (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error)
      const mensagemErro = error.message.toLowerCase()
      
      // Verifica se é erro de usuário não encontrado (fallback)
      if (
        mensagemErro.includes('user not found') ||
        mensagemErro.includes('email not found') ||
        mensagemErro.includes('does not exist')
      ) {
        return {
          error,
          mensagem: 'Nenhuma conta encontrada com este e-mail. Verifique o e-mail ou faça o registro.',
        }
      }

      return { 
        error, 
        mensagem: traduzirErro(error)
      }
    }

    console.log('✅ Email de recuperação enviado com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao enviar email de recuperação:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao enviar email de recuperação'),
      mensagem: 'Erro inesperado ao enviar email de recuperação. Tente novamente.',
    }
  }
}

/**
 * Redefine a senha do usuário
 */
export async function redefinirSenha(novaSenha: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    })

    if (error) {
      return { 
        error, 
        mensagem: traduzirErro(error)
      }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Erro ao redefinir senha'),
      mensagem: 'Erro inesperado ao redefinir senha. Tente novamente.',
    }
  }
}

/**
 * Verifica se há uma sessão ativa
 */
export async function obterSessao(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Verifica se um email já está cadastrado
 * Nota: Por questões de segurança, o Supabase não expõe uma API pública para verificar emails.
 * Esta função usa signInWithOtp com shouldCreateUser: false que não cria usuário.
 * Por segurança, retorna false por padrão para evitar falsos positivos.
 */
export async function verificarEmailExiste(email: string): Promise<{ existe: boolean; erro?: Error }> {
  try {
    // Usa signInWithOtp com shouldCreateUser: false que não cria usuário
    // Se o email não existir, pode retornar erro específico ou não retornar erro (dependendo da configuração)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Não cria usuário se não existir
        emailRedirectTo: `${import.meta.env.VITE_APP_URL}/magic-link-login`,
      },
    })

    // Se não há erro, não podemos determinar com certeza se o email existe
    // Por segurança, assumimos que não existe para evitar falsos positivos
    if (!error) {
      return { existe: false }
    }

    // Verifica mensagens de erro específicas
    const mensagemErro = error.message.toLowerCase()
    
    // Se for erro específico de usuário não encontrado, significa que não existe
    if (
      mensagemErro.includes('user not found') ||
      mensagemErro.includes('email not found') ||
      mensagemErro.includes('does not exist')
    ) {
      return { existe: false }
    }

    // Se for erro de "signups not allowed for otp", pode significar que o email existe
    // mas signups via OTP estão desabilitados, ou pode ser configuração geral
    // Por segurança, assumimos que não existe para evitar falsos positivos
    if (
      mensagemErro.includes('signups not allowed') ||
      mensagemErro.includes('signup disabled')
    ) {
      return { existe: false }
    }

    // Para outros erros, não podemos determinar com certeza
    // Por segurança, assumimos que não existe para evitar falsos positivos
    // O email só será verificado de fato quando o usuário tentar criar a conta ou fazer login
    return { existe: false }
  } catch (error) {
    // Em caso de erro inesperado, assumimos que não existe
    return {
      existe: false,
      erro: error instanceof Error ? error : new Error('Erro ao verificar email'),
    }
  }
}

/**
 * Faz logout do usuário
 */
export async function fazerLogout(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error || null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Erro ao fazer logout'),
    }
  }
}
