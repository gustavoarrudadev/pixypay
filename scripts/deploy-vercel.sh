#!/bin/bash

# Script completo para deploy na Vercel
# Inclui autenticação, link, configuração de variáveis e deploy
# Uso: bash scripts/deploy-vercel.sh

set -e

echo "🚀 Iniciando deploy completo na Vercel..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis de ambiente (compatível com bash 3.x)
VITE_SUPABASE_URL="https://giiwmavorrepzgopzmjx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE"
VITE_ENV="production"
VITE_APP_URL="https://pixypay.vercel.app"

# 1. Verificar autenticação
echo -e "${BLUE}🔐 Verificando autenticação...${NC}"
if ! npx vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Não autenticado. Fazendo login...${NC}"
    npx vercel login
else
    echo -e "${GREEN}✅ Autenticado${NC}"
    npx vercel whoami
fi
echo ""

# 2. Verificar/Linkar projeto
echo -e "${BLUE}🔗 Verificando link do projeto...${NC}"
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Projeto não linkado. Linkando...${NC}"
    npx vercel link --yes
else
    echo -e "${GREEN}✅ Projeto já está linkado${NC}"
    cat .vercel/project.json | grep -E "(projectId|orgId)" || true
fi
echo ""

# 3. Configurar variáveis de ambiente
echo -e "${BLUE}📝 Configurando variáveis de ambiente...${NC}"
echo -e "${YELLOW}NOTA: Você precisará inserir os valores quando solicitado${NC}"
echo ""

# Função para configurar variável
configure_env_var() {
    local key=$1
    local value=$2
    echo -e "${BLUE}Configurando ${key}...${NC}"
    local preview="${value:0:50}..."
    echo -e "${YELLOW}Valor: ${preview}${NC}"
    
    # Usar echo para passar o valor para o comando
    echo "$value" | npx vercel env add "$key" production preview development 2>&1 || {
        echo -e "${RED}❌ Erro ao configurar ${key}${NC}"
        echo -e "${YELLOW}Configure manualmente:${NC}"
        echo -e "  npx vercel env add ${key} production preview development"
        echo -e "  Valor: ${value}"
        echo ""
        return 1
    }
    
    echo -e "${GREEN}✅ ${key} configurado${NC}"
    echo ""
    return 0
}

# Configurar cada variável
configure_env_var "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
configure_env_var "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"
configure_env_var "VITE_ENV" "$VITE_ENV"
configure_env_var "VITE_APP_URL" "$VITE_APP_URL"

echo -e "${GREEN}✅ Variáveis configuradas${NC}"
echo ""

# 4. Fazer deploy
echo -e "${BLUE}🚀 Iniciando deploy de produção...${NC}"
npx vercel --prod --yes

echo ""
echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Acesse o dashboard: https://vercel.com/dashboard"
echo "2. Verifique o deploy em Deployments"
echo "3. Anote a URL fornecida"
echo "4. Atualize VITE_APP_URL com a URL real (se necessário)"
echo ""

