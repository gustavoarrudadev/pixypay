import { supabase } from './supabase'

/**
 * Tipos de arquivo permitidos para upload
 */
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Tamanho máximo de arquivo (5MB)
 */
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5MB em bytes

/**
 * Interface para resultado de upload
 */
export interface UploadResult {
  url: string | null
  error: Error | null
  mensagem?: string
}

/**
 * Valida arquivo antes do upload
 */
function validarArquivo(file: File): { valido: boolean; mensagem?: string } {
  // Verifica tipo
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return {
      valido: false,
      mensagem: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.',
    }
  }

  // Verifica tamanho
  if (file.size > TAMANHO_MAXIMO) {
    return {
      valido: false,
      mensagem: 'Arquivo muito grande. Tamanho máximo: 5MB.',
    }
  }

  return { valido: true }
}

/**
 * Gera nome único para arquivo
 */
function gerarNomeArquivo(revendaId: string, produtoId: string | null, extensao: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  
  if (produtoId) {
    return `produtos/${revendaId}/${produtoId}/${timestamp}-${random}.${extensao}`
  }
  
  return `logos-revendas/${revendaId}/${timestamp}-${random}.${extensao}`
}

/**
 * Extrai extensão do arquivo
 */
function obterExtensao(file: File): string {
  const nome = file.name.toLowerCase()
  if (nome.endsWith('.jpg') || nome.endsWith('.jpeg')) return 'jpg'
  if (nome.endsWith('.png')) return 'png'
  if (nome.endsWith('.webp')) return 'webp'
  
  // Tenta extrair do tipo MIME
  if (file.type.includes('jpeg')) return 'jpg'
  if (file.type.includes('png')) return 'png'
  if (file.type.includes('webp')) return 'webp'
  
  return 'jpg' // Padrão
}

/**
 * Faz upload da imagem de um produto
 * 
 * @param file Arquivo de imagem
 * @param revendaId ID da revenda
 * @param produtoId ID do produto (opcional, para atualização)
 * @returns URL da imagem ou erro
 */
export async function uploadImagemProduto(
  file: File,
  revendaId: string,
  produtoId: string | null = null
): Promise<UploadResult> {
  try {
    // Valida arquivo
    const validacao = validarArquivo(file)
    if (!validacao.valido) {
      return {
        url: null,
        error: new Error(validacao.mensagem),
        mensagem: validacao.mensagem,
      }
    }

    // Gera nome do arquivo
    const extensao = obterExtensao(file)
    const nomeArquivo = gerarNomeArquivo(revendaId, produtoId, extensao)

    // Faz upload
    const { data, error } = await supabase.storage
      .from('produtos')
      .upload(nomeArquivo, file, {
        cacheControl: '3600',
        upsert: false, // Não sobrescreve arquivos existentes
      })

    if (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error)
      // Mensagem mais específica baseada no tipo de erro
      let mensagemErro = 'Erro ao fazer upload da imagem. Tente novamente.'
      
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        mensagemErro = 'Bucket de produtos não encontrado. Verifique a configuração do Storage no Supabase.'
      } else if (error.message?.includes('new row violates row-level security')) {
        mensagemErro = 'Sem permissão para fazer upload. Verifique as políticas RLS do Storage.'
      } else if (error.message?.includes('duplicate')) {
        mensagemErro = 'Arquivo já existe. Tente novamente com outro nome.'
      }
      
      return {
        url: null,
        error,
        mensagem: mensagemErro,
      }
    }

    // Obtém URL pública
    const { data: urlData } = supabase.storage
      .from('produtos')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao fazer upload:', error)
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Erro ao fazer upload'),
      mensagem: 'Erro inesperado ao fazer upload da imagem.',
    }
  }
}

/**
 * Faz upload da logo de uma revenda
 * 
 * @param file Arquivo de imagem
 * @param revendaId ID da revenda
 * @returns URL da logo ou erro
 */
export async function uploadLogoRevenda(
  file: File,
  revendaId: string
): Promise<UploadResult> {
  try {
    // Valida arquivo
    const validacao = validarArquivo(file)
    if (!validacao.valido) {
      return {
        url: null,
        error: new Error(validacao.mensagem),
        mensagem: validacao.mensagem,
      }
    }

    // Gera nome do arquivo
    const extensao = obterExtensao(file)
    const nomeArquivo = gerarNomeArquivo(revendaId, null, extensao)

    // Faz upload
    const { data, error } = await supabase.storage
      .from('logos-revendas')
      .upload(nomeArquivo, file, {
        cacheControl: '3600',
        upsert: true, // Permite sobrescrever logo existente
      })

    if (error) {
      console.error('❌ Erro ao fazer upload da logo:', error)
      // Mensagem mais específica baseada no tipo de erro
      let mensagemErro = 'Erro ao fazer upload da logo. Tente novamente.'
      
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        mensagemErro = 'Bucket de logos não encontrado. Verifique a configuração do Storage no Supabase.'
      } else if (error.message?.includes('new row violates row-level security')) {
        mensagemErro = 'Sem permissão para fazer upload. Verifique as políticas RLS do Storage.'
      }
      
      return {
        url: null,
        error,
        mensagem: mensagemErro,
      }
    }

    // Obtém URL pública
    const { data: urlData } = supabase.storage
      .from('logos-revendas')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao fazer upload da logo:', error)
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Erro ao fazer upload'),
      mensagem: 'Erro inesperado ao fazer upload da logo.',
    }
  }
}

/**
 * Deleta uma imagem do storage
 * 
 * @param url URL completa da imagem
 * @returns Sucesso ou erro
 */
/**
 * Verifica se uma URL é de uma imagem da pasta public (não do Storage)
 */
export function ehImagemPublica(url: string): boolean {
  if (!url) return false
  // URLs da pasta public começam com /produtos/ ou são relativas
  return url.startsWith('/produtos/') || url.startsWith('./produtos/') || !url.includes('supabase.co')
}

export async function deletarImagem(url: string): Promise<{ error: Error | null; mensagem?: string }> {
  // Se for imagem da pasta public, não tenta deletar do storage
  if (ehImagemPublica(url)) {
    console.log('ℹ️ Imagem da pasta public, não será deletada do storage:', url)
    return { error: null }
  }
  try {
    // Extrai o caminho da URL
    // Exemplo: https://xxx.supabase.co/storage/v1/object/public/produtos/revenda_id/produto_id/imagem.jpg
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0)
    
    // Encontra o índice de 'public' e pega tudo depois
    const publicIndex = pathParts.indexOf('public')
    if (publicIndex === -1 || publicIndex === pathParts.length - 1) {
      return {
        error: new Error('URL inválida'),
        mensagem: 'URL da imagem inválida.',
      }
    }

    // O bucket é o primeiro elemento depois de 'public'
    const bucket = pathParts[publicIndex + 1] // produtos ou logos-revendas
    
    // O path é tudo depois do bucket (sem incluir o bucket)
    const path = pathParts.slice(publicIndex + 2).join('/')

    if (!bucket || !path) {
      return {
        error: new Error('URL inválida'),
        mensagem: 'Não foi possível extrair bucket ou caminho da URL.',
      }
    }

    // Deleta arquivo
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('❌ Erro ao deletar imagem:', error)
      return {
        error,
        mensagem: 'Erro ao deletar imagem.',
      }
    }

    return { error: null }
  } catch (error) {
    // Se não conseguir fazer parse da URL, pode ser imagem da pasta public
    if (ehImagemPublica(url)) {
      console.log('ℹ️ Imagem da pasta public (erro no parse), não será deletada:', url)
      return { error: null }
    }
    
    console.error('❌ Erro inesperado ao deletar imagem:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao deletar imagem'),
      mensagem: 'Erro inesperado ao deletar imagem.',
    }
  }
}

/**
 * Obtém URL pública de uma imagem
 * 
 * @param bucket Nome do bucket (produtos ou logos-revendas)
 * @param path Caminho do arquivo
 * @returns URL pública
 */
export function obterUrlPublica(bucket: 'produtos' | 'logos-revendas', path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

