#!/usr/bin/env node

/**
 * Script para adicionar variáveis de ambiente na Vercel via API REST
 * Uso: node scripts/adicionar-variaveis-vercel-api.js
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Variáveis de ambiente
const envVars = [
  {
    key: 'VITE_SUPABASE_URL',
    value: 'https://giiwmavorrepzgopzmjx.supabase.co',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'VITE_ENV',
    value: 'production',
    target: ['production']
  },
  {
    key: 'VITE_ENV',
    value: 'development',
    target: ['preview', 'development']
  },
  {
    key: 'VITE_APP_URL',
    value: 'https://pixypay.vercel.app',
    target: ['production', 'preview', 'development']
  }
]

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
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

function getVercelToken() {
  // Tentar obter token do arquivo de configuração do Vercel
  const configPath = join(process.env.HOME || process.env.USERPROFILE || '', '.vercel', 'auth.json')
  
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      // O token pode estar em diferentes lugares dependendo da versão do CLI
      return config.token || config.credentials?.find(c => c.token)?.token
    } catch (error) {
      // Ignorar erro
    }
  }
  
  // Tentar obter via variável de ambiente
  return process.env.VERCEL_TOKEN
}

function getProjectInfo() {
  const projectJsonPath = join(rootDir, '.vercel', 'project.json')
  
  if (existsSync(projectJsonPath)) {
    try {
      return JSON.parse(readFileSync(projectJsonPath, 'utf-8'))
    } catch (error) {
      log('Erro ao ler .vercel/project.json', 'error')
    }
  }
  
  return null
}

async function addEnvVarViaCLI(key, value, targets) {
  log(`Adicionando ${key}...`, 'info')
  
  for (const target of targets) {
    try {
      // Usar echo para passar o valor de forma não-interativa
      const command = `echo "${value.replace(/"/g, '\\"')}" | npx vercel env add ${key} ${target}`
      execSync(command, { 
        cwd: rootDir,
        stdio: 'pipe',
        shell: true
      })
      log(`  ✅ ${key} adicionado para ${target}`, 'success')
    } catch (error) {
      // Se já existe, tentar atualizar
      try {
        const updateCommand = `echo "${value.replace(/"/g, '\\"')}" | npx vercel env update ${key} ${target}`
        execSync(updateCommand, {
          cwd: rootDir,
          stdio: 'pipe',
          shell: true
        })
        log(`  ✅ ${key} atualizado para ${target}`, 'success')
      } catch (updateError) {
        log(`  ⚠️  ${key} para ${target}: ${error.message}`, 'warning')
      }
    }
  }
}

async function main() {
  log('Iniciando configuração de variáveis de ambiente...', 'info')
  console.log('')

  // Verificar autenticação
  try {
    execSync('npx vercel whoami', { stdio: 'pipe', cwd: rootDir })
    log('Autenticado na Vercel', 'success')
  } catch (error) {
    log('Não autenticado. Por favor, faça login primeiro:', 'error')
    console.log('  Execute: npx vercel login')
    process.exit(1)
  }

  // Verificar se projeto está linkado
  const projectInfo = getProjectInfo()
  if (!projectInfo) {
    log('Projeto não está linkado. Linkando...', 'warning')
    try {
      execSync('npx vercel link --yes', { stdio: 'inherit', cwd: rootDir })
    } catch (error) {
      log('Erro ao linkar projeto. Execute: npx vercel link', 'error')
      process.exit(1)
    }
  } else {
    log(`Projeto linkado: ${projectInfo.projectId}`, 'info')
  }

  console.log('')
  log('Adicionando variáveis de ambiente...', 'info')
  console.log('')

  // Adicionar cada variável
  for (const envVar of envVars) {
    await addEnvVarViaCLI(envVar.key, envVar.value, envVar.target)
    console.log('')
  }

  log('Variáveis de ambiente configuradas!', 'success')
  console.log('')
  log('Próximo passo: Fazer deploy', 'info')
  log('  Execute: npx vercel --prod', 'info')
}

main().catch(error => {
  log('Erro fatal:', 'error')
  console.error(error)
  process.exit(1)
})

