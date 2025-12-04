#!/usr/bin/env node

/**
 * Script para fazer deploy completo na Vercel
 * Inclui configuração de variáveis de ambiente e deploy
 * 
 * Uso: node scripts/deploy-vercel-completo.js
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Variáveis de ambiente do projeto
const envVars = {
  VITE_SUPABASE_URL: 'https://giiwmavorrepzgopzmjx.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE',
  VITE_ENV: 'production',
  VITE_APP_URL: 'https://pixypay.vercel.app' // Será atualizado após primeiro deploy
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  }
  const icon = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }
  console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`)
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      cwd: rootDir,
      stdio: 'inherit',
      ...options 
    })
  } catch (error) {
    log(`Erro ao executar: ${command}`, 'error')
    throw error
  }
}

async function main() {
  log('Iniciando processo de deploy na Vercel...', 'info')
  console.log('')

  // 1. Verificar se está autenticado
  log('Verificando autenticação Vercel...', 'info')
  try {
    execCommand('npx vercel whoami', { stdio: 'pipe' })
    log('Autenticado na Vercel', 'success')
  } catch (error) {
    log('Não autenticado. Por favor, faça login primeiro:', 'warning')
    console.log('')
    console.log('Execute: npx vercel login')
    console.log('Ou forneça um token: npx vercel login --token SEU_TOKEN')
    console.log('')
    process.exit(1)
  }

  // 2. Verificar se projeto está linkado
  log('Verificando se projeto está linkado...', 'info')
  let projectLinked = false
  try {
    execCommand('test -f .vercel/project.json', { stdio: 'pipe' })
    projectLinked = true
    log('Projeto já está linkado', 'success')
  } catch (error) {
    log('Projeto não está linkado. Linkando...', 'warning')
    try {
      execCommand('npx vercel link --yes', { stdio: 'inherit' })
      projectLinked = true
      log('Projeto linkado com sucesso', 'success')
    } catch (linkError) {
      log('Erro ao linkar projeto. Tente manualmente: npx vercel link', 'error')
      process.exit(1)
    }
  }

  // 3. Ler informações do projeto
  let projectId = null
  let teamId = null
  try {
    const projectJson = JSON.parse(readFileSync('.vercel/project.json', 'utf-8'))
    projectId = projectJson.projectId
    teamId = projectJson.orgId
    log(`Projeto ID: ${projectId}`, 'info')
    log(`Team ID: ${teamId}`, 'info')
  } catch (error) {
    log('Não foi possível ler informações do projeto', 'warning')
  }

  // 4. Configurar variáveis de ambiente
  log('Configurando variáveis de ambiente...', 'info')
  console.log('')
  
  for (const [key, value] of Object.entries(envVars)) {
    try {
      log(`Configurando ${key}...`, 'info')
      // Usar vercel env add para adicionar variáveis
      const command = `npx vercel env add ${key} production preview development <<EOF
${value}
EOF`
      execCommand(command, { stdio: 'pipe' })
      log(`${key} configurado`, 'success')
    } catch (error) {
      log(`Erro ao configurar ${key}. Configure manualmente no dashboard.`, 'warning')
    }
  }

  console.log('')
  log('Variáveis de ambiente configuradas', 'success')
  console.log('')

  // 5. Fazer deploy
  log('Iniciando deploy...', 'info')
  try {
    execCommand('npx vercel --prod --yes', { stdio: 'inherit' })
    log('Deploy concluído com sucesso!', 'success')
  } catch (error) {
    log('Erro no deploy. Verifique os logs acima.', 'error')
    process.exit(1)
  }

  console.log('')
  log('Processo concluído!', 'success')
  log('Acesse o dashboard da Vercel para ver o deploy:', 'info')
  log('https://vercel.com/dashboard', 'info')
}

main().catch(error => {
  log('Erro fatal:', 'error')
  console.error(error)
  process.exit(1)
})





