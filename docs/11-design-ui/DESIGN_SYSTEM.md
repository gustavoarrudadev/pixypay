# Design System - Pixy Pay

## Cores

### Tema Base: Neutral
Utilizamos a escala completa Neutral (50-950) do Tailwind CSS para criar hierarquia visual:

- **Neutral 50-100**: Fundos muito claros (light mode)
- **Neutral 200-300**: Bordas e elementos secundários (light mode)
- **Neutral 600-700**: Textos secundários (light mode)
- **Neutral 900**: Textos principais (light mode)
- **Neutral 950**: Fundo principal (dark mode)
- **Neutral 800-900**: Bordas e elementos secundários (dark mode)
- **Neutral 400-500**: Textos secundários (dark mode)
- **Neutral 50**: Textos principais (dark mode)

### Cor de Destaque: Violet
A cor violet é aplicada estrategicamente em:

- Botões primários
- Estados de foco (ring/outline)
- Links ativos
- Ícones de ação
- Indicadores de status positivo

**Uso limitado**: A cor violet representa no máximo 5-10% da interface, garantindo que o Neutral continue sendo a base visual.

## Tipografia

### Fonte Principal
- **Geist Sans**: Fonte principal do projeto (Vercel)
- Aplicada em todos os textos da interface

### Fonte Monoespaçada
- **Geist Mono**: Para código e elementos técnicos

## Componentes

### Button
- Variantes: default, destructive, outline, secondary, ghost, link
- Tamanhos: default, sm, lg, icon
- Cor primária: Violet

### Input
- Bordas: Neutral 300 (light) / Neutral 700 (dark)
- Focus: Ring violet
- Transições suaves

### Card
- Fundo: White (light) / Neutral 900 (dark)
- Borda: Neutral 200 (light) / Neutral 800 (dark)
- Sombra: Suave e discreta
- Animações: Transições de 300ms

## Animações

Todas as animações são minimalistas, fluidas e suaves:

- **fade-in**: Entrada suave com movimento vertical
- **slide-in**: Entrada lateral
- **Transições**: Duração padrão de 200-300ms
- **Hover**: Mudanças de cor suaves

## Dark Mode

O sistema suporta Dark Mode completo com:

- Toggle no canto superior direito
- Persistência no localStorage
- Transições suaves entre temas
- Hierarquia visual mantida em ambos os modos

## Espaçamento

Seguindo o sistema de espaçamento do Tailwind:
- Base: 4px (0.25rem)
- Escala: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, etc.

## Bordas

- Raio padrão: 0.5rem (--radius)
- Cards: rounded-lg
- Inputs: rounded-md
- Botões: rounded-md

