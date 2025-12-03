/**
 * Traduz mensagens de erro do Supabase para Português Brasil
 */
export function traduzirErro(erro: Error | string | null | { message?: string }): string {
  if (!erro) return 'Erro desconhecido'
  
  let mensagem: string
  if (typeof erro === 'string') {
    mensagem = erro
  } else if (erro instanceof Error) {
    mensagem = erro.message
  } else if (erro && typeof erro === 'object' && 'message' in erro) {
    mensagem = erro.message || 'Erro desconhecido'
  } else {
    return 'Erro desconhecido'
  }
  
  const mensagemLower = mensagem.toLowerCase()

  // Mapeamento de erros comuns do Supabase
  const traducoes: { [key: string]: string } = {
    'invalid login credentials': 'Credenciais inválidas. Verifique seu e-mail e senha.',
    'invalid credentials': 'Credenciais inválidas. Verifique seu e-mail e senha.',
    'email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada e confirme seu e-mail.',
    'user not found': 'Usuário não encontrado. Faça o registro primeiro.',
    'email already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'email already exists': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'password too weak': 'Senha muito fraca. Use uma senha mais forte.',
    'invalid email': 'E-mail inválido. Verifique o formato do e-mail.',
    'email rate limit exceeded': 'Limite de e-mails excedido. Aguarde alguns minutos e tente novamente.',
    'token expired': 'Link expirado. Solicite um novo link.',
    'token has expired': 'Link expirado. Solicite um novo link.',
    'invalid token': 'Link inválido. Solicite um novo link.',
    'invalid token hash': 'Link inválido. Solicite um novo link.',
    'signup disabled': 'Cadastro desabilitado. Entre em contato com o suporte.',
    'signups not allowed for otp': 'Cadastro não permitido via Magic Link. Use o formulário de registro.',
    'signups not allowed': 'Cadastro não permitido. Entre em contato com o suporte.',
    'email rate limit exceeded. please try again later': 'Limite de e-mails excedido. Tente novamente mais tarde.',
    'forbidden': 'Acesso negado. Verifique suas permissões.',
    'unauthorized': 'Não autorizado. Faça login novamente.',
    'network error': 'Erro de conexão. Verifique sua internet.',
    'network request failed': 'Falha na conexão. Verifique sua internet.',
    'new password should be different from the old password': 'A nova senha deve ser diferente da senha atual.',
    'for security purposes, you can only request this after': 'Por questões de segurança, você só pode solicitar isso após',
    'seconds': 'segundos',
    'user is banned': 'Sua conta está SUSPENSA, entre em contato com o suporte.',
    'email not authorized': 'Sua conta está SUSPENSA, entre em contato com o suporte.',
    'user banned': 'Sua conta está SUSPENSA, entre em contato com o suporte.',
    'account suspended': 'Sua conta está SUSPENSA, entre em contato com o suporte.',
    'account has been suspended': 'Sua conta está SUSPENSA, entre em contato com o suporte.',
  }

  // Procura por correspondências parciais
  for (const [chave, traducao] of Object.entries(traducoes)) {
    if (mensagemLower.includes(chave)) {
      // Tratamento especial para mensagens com tempo de espera
      if (chave === 'for security purposes, you can only request this after') {
        // Extrai o número de segundos da mensagem original
        const match = mensagem.match(/(\d+)\s*seconds?/i)
        if (match) {
          const segundos = match[1]
          return `Por questões de segurança, você só pode solicitar isso após ${segundos} segundos.`
        }
        return traducao
      }
      return traducao
    }
  }

  // Verificação específica para mensagem de senha diferente
  if (mensagemLower.includes('new password should be different')) {
    return 'A nova senha deve ser diferente da senha atual.'
  }

  // Verificação específica para mensagem de tempo de espera (com regex mais flexível)
  const tempoEsperaMatch = mensagem.match(/for security purposes.*?(\d+)\s*seconds?/i)
  if (tempoEsperaMatch) {
    const segundos = tempoEsperaMatch[1]
    return `Por questões de segurança, você só pode solicitar isso após ${segundos} segundos.`
  }

  // Se não encontrou tradução específica, retorna a mensagem original
  // mas tenta melhorar algumas palavras comuns
  let mensagemTraduzida = mensagem
    .replace(/invalid login credentials/gi, 'Credenciais inválidas')
    .replace(/email not confirmed/gi, 'E-mail não confirmado')
    .replace(/user not found/gi, 'Usuário não encontrado')
    .replace(/token expired/gi, 'Link expirado')
    .replace(/invalid token/gi, 'Link inválido')
    .replace(/new password should be different from the old password/gi, 'A nova senha deve ser diferente da senha atual.')
    .replace(/for security purposes, you can only request this after (\d+) seconds?/gi, (match, segundos) => 
      `Por questões de segurança, você só pode solicitar isso após ${segundos} segundos.`
    )

  return mensagemTraduzida
}
