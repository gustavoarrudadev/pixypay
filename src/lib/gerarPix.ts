/**
 * Gera código PIX copia e cola e QR Code para uma parcela
 * Por enquanto, gera um código mockado. Em produção, integrar com gateway de pagamento
 */

export interface DadosPix {
  pix_copia_cola: string
  qr_code_url: string
}

/**
 * Gera dados PIX para uma parcela
 * @param valor Valor da parcela (em reais, não centavos)
 * @param descricao Descrição do pagamento
 * @param chavePix Chave PIX do recebedor (opcional)
 */
export async function gerarPix(
  valor: number,
  descricao: string,
  chavePix?: string
): Promise<DadosPix> {
  // Por enquanto, gera um código mockado
  // Em produção, integrar com gateway de pagamento (ex: Gerencianet, Mercado Pago, etc)
  
  // Formato EMV (padrão PIX) - versão simplificada para mock
  const timestamp = Date.now()
  const valorFormatado = valor.toFixed(2).replace('.', '').padStart(10, '0')
  
  // Gera um código mockado no formato EMV simplificado
  // Em produção, isso viria de uma API de pagamento real
  // Formato: 00020126[payload]6304[CRC]
  const payload = `01${String(chavePix || '12345678901').length.toString().padStart(2, '0')}${chavePix || '12345678901'}02${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}05${String(descricao.length).padStart(2, '0')}${descricao.substring(0, 25)}`
  const pixCopiaCola = `00020126${payload}5204000053039865802BR5925PIXYPAY SISTEMA DE PAG6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Gera QR Code usando API externa
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopiaCola)}&margin=1`

  return {
    pix_copia_cola: pixCopiaCola,
    qr_code_url: qrCodeUrl,
  }
}

/**
 * Atualiza uma parcela com dados PIX gerados
 */
export async function atualizarParcelaComPix(
  parcelaId: string,
  dadosPix: DadosPix
): Promise<{ error: Error | null }> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  const { error } = await supabase
    .from('parcelas')
    .update({
      pix_copia_cola: dadosPix.pix_copia_cola,
    })
    .eq('id', parcelaId)

  return { error }
}
