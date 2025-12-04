/**
 * Configurações e dados dos produtos padrão do sistema
 */

export type TipoProduto = 'botijoes' | 'galaodeagua' | 'equipamentos' | 'personalizado'

export type MarcaBotijao = 'ultragaz' | 'copaenergia' | 'supergasbras' | 'nacionalgas' | 'consigaz'

export type TipoBotijao = 'p13' | 'p20' | 'p45'

export type TipoEquipamento = 'kitregistroemangueira' | 'registro' | 'mangueira'

export interface ConfigProdutoBotijao {
  marca: MarcaBotijao
  tipo: TipoBotijao
}

export interface ConfigProdutoEquipamento {
  tipo: TipoEquipamento
}

/**
 * Marcas de botijões disponíveis
 */
export const MARCAS_BOTIJOES: { value: MarcaBotijao; label: string }[] = [
  { value: 'ultragaz', label: 'Ultragaz' },
  { value: 'copaenergia', label: 'Copa Energia' },
  { value: 'supergasbras', label: 'Supergasbras' },
  { value: 'nacionalgas', label: 'Nacional Gás' },
  { value: 'consigaz', label: 'Consigaz' },
]

/**
 * Tipos de botijões disponíveis
 */
export const TIPOS_BOTIJOES: { value: TipoBotijao; label: string }[] = [
  { value: 'p13', label: 'Botijão P13' },
  { value: 'p20', label: 'Botijão P20' },
  { value: 'p45', label: 'Botijão P45' },
]

/**
 * Tipos de equipamentos disponíveis
 */
export const TIPOS_EQUIPAMENTOS: { value: TipoEquipamento; label: string }[] = [
  { value: 'kitregistroemangueira', label: 'Kit Registro e Mangueira' },
  { value: 'registro', label: 'Registro' },
  { value: 'mangueira', label: 'Mangueira' },
]

/**
 * Obtém a URL da imagem de um botijão
 */
export function obterImagemBotijao(marca: MarcaBotijao, tipo: TipoBotijao): string {
  // Normaliza o nome da marca para o formato da pasta
  const marcaNormalizada = marca.toLowerCase()
  const tipoNormalizado = tipo.toLowerCase()
  
  // Retorna o caminho relativo da imagem na pasta public
  // A pasta está como "botijões" (com acento) conforme estrutura real
  return `/produtos/botijões/${marcaNormalizada}/${tipoNormalizado}.png`
}

/**
 * Obtém o nome do produto para um botijão
 */
export function obterNomeBotijao(tipo: TipoBotijao): string {
  const tipos: Record<TipoBotijao, string> = {
    p13: 'Botijão P13',
    p20: 'Botijão P20',
    p45: 'Botijão P45',
  }
  return tipos[tipo]
}

/**
 * Obtém a URL da imagem do galão de água
 */
export function obterImagemGalaoAgua(): string {
  return '/produtos/galaodeagua/galaodeagua20litros.png'
}

/**
 * Obtém o nome do produto para galão de água
 */
export function obterNomeGalaoAgua(): string {
  return 'Galão de Água 20L'
}

/**
 * Obtém a URL da imagem de um equipamento
 */
export function obterImagemEquipamento(tipo: TipoEquipamento): string {
  // Mapeia o tipo para o nome do arquivo
  const arquivos: Record<TipoEquipamento, string> = {
    kitregistroemangueira: 'kitregistroemangueira.png',
    registro: 'registro.png',
    mangueira: 'mangueira.png',
  }
  
  return `/produtos/equipamentos/${arquivos[tipo]}`
}

/**
 * Obtém o nome do produto para um equipamento
 */
export function obterNomeEquipamento(tipo: TipoEquipamento): string {
  const tipos: Record<TipoEquipamento, string> = {
    kitregistroemangueira: 'Kit Registro e Mangueira',
    registro: 'Registro',
    mangueira: 'Mangueira',
  }
  return tipos[tipo]
}

/**
 * Verifica se uma imagem existe (tenta carregar)
 */
export async function verificarImagemExiste(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

