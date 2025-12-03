/**
 * Aplica máscara de telefone brasileiro no formato (00) 0-0000-0000
 */
export function aplicarMascaraTelefone(valor: string): string {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '')
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const numerosLimitados = apenasNumeros.slice(0, 11)
  
  // Aplica a máscara
  if (numerosLimitados.length <= 2) {
    return `(${numerosLimitados}`
  } else if (numerosLimitados.length <= 3) {
    return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2)}`
  } else if (numerosLimitados.length <= 7) {
    return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 3)}-${numerosLimitados.slice(3)}`
  } else {
    return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 3)}-${numerosLimitados.slice(3, 7)}-${numerosLimitados.slice(7)}`
  }
}

/**
 * Remove a máscara do telefone, retornando apenas números
 */
export function removerMascaraTelefone(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Aplica máscara de CPF brasileiro no formato 000.000.000-00
 */
export function aplicarMascaraCPF(valor: string): string {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const numerosLimitados = apenasNumeros.slice(0, 11)
  
  // Aplica a máscara
  if (numerosLimitados.length <= 3) {
    return numerosLimitados
  } else if (numerosLimitados.length <= 6) {
    return `${numerosLimitados.slice(0, 3)}.${numerosLimitados.slice(3)}`
  } else if (numerosLimitados.length <= 9) {
    return `${numerosLimitados.slice(0, 3)}.${numerosLimitados.slice(3, 6)}.${numerosLimitados.slice(6)}`
  } else {
    return `${numerosLimitados.slice(0, 3)}.${numerosLimitados.slice(3, 6)}.${numerosLimitados.slice(6, 9)}-${numerosLimitados.slice(9)}`
  }
}

/**
 * Remove a máscara do CPF, retornando apenas números
 */
export function removerMascaraCPF(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Aplica máscara de CNPJ brasileiro no formato 00.000.000/0000-00
 */
export function aplicarMascaraCNPJ(valor: string): string {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '')
  
  // Limita a 14 dígitos
  const numerosLimitados = apenasNumeros.slice(0, 14)
  
  // Aplica a máscara
  if (numerosLimitados.length <= 2) {
    return numerosLimitados
  } else if (numerosLimitados.length <= 5) {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2)}`
  } else if (numerosLimitados.length <= 8) {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2, 5)}.${numerosLimitados.slice(5)}`
  } else if (numerosLimitados.length <= 12) {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2, 5)}.${numerosLimitados.slice(5, 8)}/${numerosLimitados.slice(8)}`
  } else {
    return `${numerosLimitados.slice(0, 2)}.${numerosLimitados.slice(2, 5)}.${numerosLimitados.slice(5, 8)}/${numerosLimitados.slice(8, 12)}-${numerosLimitados.slice(12)}`
  }
}

/**
 * Remove a máscara do CNPJ, retornando apenas números
 */
export function removerMascaraCNPJ(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Aplica máscara de CEP brasileiro no formato 00000-000
 */
export function aplicarMascaraCEP(valor: string): string {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '')
  
  // Limita a 8 dígitos
  const numerosLimitados = apenasNumeros.slice(0, 8)
  
  // Aplica a máscara
  if (numerosLimitados.length <= 5) {
    return numerosLimitados
  } else {
    return `${numerosLimitados.slice(0, 5)}-${numerosLimitados.slice(5)}`
  }
}

/**
 * Remove a máscara do CEP, retornando apenas números
 */
export function removerMascaraCEP(valor: string): string {
  return valor.replace(/\D/g, '')
}

