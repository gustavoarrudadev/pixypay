#!/bin/bash

# Script para adicionar variáveis de ambiente na Vercel via CLI
# Uso: bash scripts/adicionar-env-vercel.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Configurando variáveis de ambiente na Vercel...${NC}"
echo ""

# Verificar autenticação
if ! npx vercel whoami &>/dev/null; then
    echo -e "${RED}❌ Não autenticado${NC}"
    echo -e "${YELLOW}Por favor, faça login primeiro:${NC}"
    echo "  npx vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Autenticado${NC}"
echo ""

# Verificar se projeto está linkado
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Projeto não linkado. Linkando...${NC}"
    npx vercel link --yes
fi

echo -e "${BLUE}📝 Adicionando variáveis de ambiente...${NC}"
echo ""

# Função para adicionar variável
add_env_var() {
    local key=$1
    local value=$2
    local targets=$3
    
    echo -e "${BLUE}Configurando ${key}...${NC}"
    
    for target in $targets; do
        echo "$value" | npx vercel env add "$key" "$target" 2>&1 | grep -v "Enter" || {
            # Se falhar, tentar atualizar
            echo "$value" | npx vercel env update "$key" "$target" 2>&1 | grep -v "Enter" || {
                echo -e "${YELLOW}  ⚠️  ${key} para ${target} - pode já existir${NC}"
            }
        }
    done
    
    echo -e "${GREEN}✅ ${key} configurado${NC}"
    echo ""
}

# Adicionar variáveis
add_env_var "VITE_SUPABASE_URL" "https://giiwmavorrepzgopzmjx.supabase.co" "production preview development"
add_env_var "VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE" "production preview development"
add_env_var "VITE_ENV" "production" "production"
add_env_var "VITE_ENV" "development" "preview development"
add_env_var "VITE_APP_URL" "https://pixypay.vercel.app" "production preview development"

echo -e "${GREEN}🎉 Variáveis de ambiente configuradas!${NC}"
echo ""
echo -e "${BLUE}Próximo passo:${NC}"
echo "  npx vercel --prod"





