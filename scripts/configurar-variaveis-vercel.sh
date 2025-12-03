#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel via CLI
# Uso: bash scripts/configurar-variaveis-vercel.sh

set -e

echo "🔐 Configurando variáveis de ambiente na Vercel..."
echo ""

# Verificar se está autenticado
if ! npx vercel whoami &>/dev/null; then
    echo "❌ Não autenticado. Execute primeiro: npx vercel login"
    exit 1
fi

echo "✅ Autenticado na Vercel"
echo ""

# Variáveis de ambiente
declare -A ENV_VARS=(
    ["VITE_SUPABASE_URL"]="https://giiwmavorrepzgopzmjx.supabase.co"
    ["VITE_SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE"
    ["VITE_ENV"]="production"
    ["VITE_APP_URL"]="https://pixypay.vercel.app"
)

# Configurar cada variável
for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    echo "📝 Configurando $key..."
    echo "$value" | npx vercel env add "$key" production preview development
    echo "✅ $key configurado"
    echo ""
done

echo "🎉 Todas as variáveis foram configuradas!"
echo ""
echo "Próximo passo: Fazer deploy"
echo "  npx vercel --prod"

