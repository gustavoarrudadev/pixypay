# QR Code do Link Público - Dashboard Revenda

## Visão Geral

Funcionalidade que gera automaticamente um QR Code do link público da loja na Dashboard da Revenda, permitindo que a revenda compartilhe facilmente sua loja pública através de código QR.

## Funcionalidades

### 1. **Geração Automática**
- QR Code é gerado automaticamente quando há um link público configurado
- Atualiza automaticamente quando o link público é alterado
- Usa API externa (QR Server) para gerar o código

### 2. **Download do QR Code**
- Botão "Baixar QR Code" permite salvar a imagem
- Arquivo é nomeado com base no link público (ex: `qr-code-revenda-exemplo.png`)
- Formato PNG para máxima compatibilidade

### 3. **Atualização Dinâmica**
- Quando o link público muda, o QR Code é atualizado automaticamente
- Não requer recarregamento da página
- Sincronizado com o estado do link público

## Implementação

### Componente QRCode (`src/components/revendas/QRCode.tsx`)

**Props:**
- `url`: URL completa para gerar o QR Code (obrigatório)
- `size`: Tamanho do QR Code em pixels (padrão: 200)
- `className`: Classes CSS adicionais (opcional)

**Funcionalidades:**
- Gera QR Code usando API externa (`api.qrserver.com`)
- Exibe placeholder quando não há URL
- Permite download da imagem do QR Code
- Atualiza automaticamente quando a URL muda

### Integração na Dashboard (`src/pages/revenda/Dashboard.tsx`)

**Localização:**
- Exibido abaixo da URL completa
- Dentro do card "Link Público da Loja"
- Aparece apenas quando há um link público configurado

**Layout:**
- QR Code à esquerda (200x200px)
- Informações explicativas à direita
- Botão de download abaixo do QR Code
- Layout responsivo (flex-wrap)

## API Utilizada

### QR Server API
- **URL**: `https://api.qrserver.com/v1/create-qr-code/`
- **Parâmetros**:
  - `size`: Tamanho em pixels (ex: 200x200)
  - `data`: URL codificada
  - `margin`: Margem ao redor do QR Code (padrão: 1)
- **Formato**: PNG
- **Gratuita**: Sim, sem necessidade de autenticação

## Fluxo de Uso

1. **Configurar Link Público:**
   - Revenda acessa Dashboard
   - Digita ou gera um link público
   - Salva o link

2. **QR Code Gerado:**
   - Sistema gera automaticamente o QR Code
   - Exibe ao lado da URL completa
   - Mostra informações explicativas

3. **Download:**
   - Revenda clica em "Baixar QR Code"
   - Arquivo PNG é baixado
   - Pode ser usado para impressão ou compartilhamento

4. **Atualização:**
   - Se o link público mudar, QR Code atualiza automaticamente
   - Não requer ação manual

## Casos de Uso

### Caso 1: Compartilhamento Físico
- Revenda baixa o QR Code
- Imprime em materiais de marketing
- Clientes escaneiam e acessam a loja

### Caso 2: Compartilhamento Digital
- Revenda baixa o QR Code
- Compartilha em redes sociais
- Clientes escaneiam pelo celular

### Caso 3: Atualização de Link
- Revenda altera o link público
- QR Code atualiza automaticamente
- QR Codes antigos continuam funcionando (redirecionam para novo link se configurado)

## Estados do Componente

### Sem URL
- Exibe placeholder com mensagem
- Indica que é necessário configurar o link público
- Não exibe botão de download

### Com URL
- Exibe QR Code gerado
- Mostra botão de download
- Atualiza quando URL muda

## Benefícios

✅ **Facilidade**: Geração automática sem configuração  
✅ **Atualização**: Sincronizado com link público  
✅ **Download**: Permite salvar para uso offline  
✅ **Responsivo**: Funciona em diferentes tamanhos de tela  
✅ **Sem Dependências**: Usa API externa, não requer bibliotecas adicionais

## Arquivos Modificados

- `src/components/revendas/QRCode.tsx` - Novo componente QR Code
- `src/pages/revenda/Dashboard.tsx` - Integração do QR Code na Dashboard

## Notas Técnicas

- QR Code é gerado via API externa (sem necessidade de bibliotecas locais)
- Imagem é carregada via `<img>` tag
- Download funciona através de link temporário criado dinamicamente
- Nome do arquivo usa o link público para facilitar identificação
- Componente é reativo e atualiza quando props mudam

