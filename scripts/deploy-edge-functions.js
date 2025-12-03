#!/usr/bin/env node

/**
 * 🚀 Script de Deploy Automático das Edge Functions
 * 
 * Este script faz deploy de todas as Edge Functions do projeto automaticamente.
 * 
 * USO:
 *   npm run deploy:functions
 *   ou
 *   node scripts/deploy-edge-functions.js
 * 
 * REQUISITOS:
 *   - Node.js instalado
 *   - Variáveis de ambiente configuradas no .env
 *   - Supabase CLI instalado (será verificado e instalado se necessário)
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logStep(message) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`🚀 ${message}`, 'magenta');
  log('='.repeat(70), 'cyan');
}

// Verificar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  logError('VITE_SUPABASE_URL ou SUPABASE_URL não encontrado no .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  logError('SUPABASE_SERVICE_ROLE_KEY não encontrado no .env');
  logInfo('Obtenha em: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Extrair project_ref da URL
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch ? projectRefMatch[1] : null;

if (!projectRef) {
  logError('Não foi possível extrair project_ref da URL do Supabase');
  process.exit(1);
}

// Verificar se Supabase CLI está instalado
function verificarSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

// Instalar Supabase CLI se necessário
async function instalarSupabaseCLI() {
  if (verificarSupabaseCLI()) {
    logSuccess('Supabase CLI já está instalado');
    return true;
  }

  logWarning('Supabase CLI não encontrado. Tentando instalar...');
  
  try {
    logInfo('Instalando Supabase CLI via npm...');
    execSync('npm install -g supabase', { stdio: 'inherit' });
    logSuccess('Supabase CLI instalado com sucesso!');
    return true;
  } catch (err) {
    logError('Não foi possível instalar Supabase CLI automaticamente');
    logInfo('Instale manualmente: npm install -g supabase');
    return false;
  }
}

// Fazer deploy de Edge Function
async function deployEdgeFunction(nomeFuncao) {
  if (!verificarSupabaseCLI()) {
    logWarning(`Não é possível fazer deploy de "${nomeFuncao}" sem Supabase CLI`);
    return { sucesso: false, erro: 'CLI não disponível' };
  }

  const functionPath = join(rootDir, 'supabase/functions', nomeFuncao);
  
  if (!existsSync(functionPath)) {
    logWarning(`Edge Function "${nomeFuncao}" não encontrada em ${functionPath}`);
    return { sucesso: false, erro: 'Função não encontrada' };
  }

  // Verificar se existe arquivo index.ts ou index.js
  const indexFile = existsSync(join(functionPath, 'index.ts')) 
    ? join(functionPath, 'index.ts')
    : existsSync(join(functionPath, 'index.js'))
    ? join(functionPath, 'index.js')
    : null;

  if (!indexFile) {
    logWarning(`Arquivo index.ts ou index.js não encontrado em "${nomeFuncao}"`);
    return { sucesso: false, erro: 'Arquivo index não encontrado' };
  }

  try {
    logInfo(`Fazendo deploy de "${nomeFuncao}"...`);
    
    // Garantir que está linkado ao projeto
    try {
      execSync(`supabase link --project-ref ${projectRef}`, {
        stdio: 'ignore',
        cwd: rootDir,
      });
      logInfo(`Projeto linkado: ${projectRef}`);
    } catch (linkErr) {
      // Pode já estar linkado, ignorar
      logInfo('Projeto pode já estar linkado, continuando...');
    }

    // Configurar variáveis de ambiente (secrets) antes do deploy
    logInfo(`Configurando variáveis de ambiente para "${nomeFuncao}"...`);
    try {
      // Configurar SUPABASE_URL
      execSync(`supabase secrets set SUPABASE_URL="${supabaseUrl}" --project-ref ${projectRef}`, {
        stdio: 'ignore',
        cwd: rootDir,
      });
      
      // Configurar SUPABASE_SERVICE_ROLE_KEY
      execSync(`supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}" --project-ref ${projectRef}`, {
        stdio: 'ignore',
        cwd: rootDir,
      });
      
      // Configurar VITE_APP_URL se existir
      const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'http://localhost:5173';
      execSync(`supabase secrets set VITE_APP_URL="${appUrl}" --project-ref ${projectRef}`, {
        stdio: 'ignore',
        cwd: rootDir,
      });
      
      logSuccess(`Variáveis de ambiente configuradas para "${nomeFuncao}"`);
    } catch (secretErr) {
      logWarning(`Não foi possível configurar secrets (podem já estar configurados): ${secretErr.message}`);
    }

    // Fazer deploy da função
    try {
      execSync(`supabase functions deploy ${nomeFuncao} --project-ref ${projectRef}`, {
        stdio: 'inherit',
        cwd: rootDir,
        env: {
          ...process.env,
          SUPABASE_ACCESS_TOKEN: supabaseServiceKey,
        },
      });

      logSuccess(`Edge Function "${nomeFuncao}" deployada com sucesso!`);
      return { sucesso: true, erro: null };
    } catch (deployErr) {
      // Tentar método alternativo sem --project-ref (se já estiver linkado)
      logInfo('Tentando método alternativo de deploy...');
      try {
        execSync(`supabase functions deploy ${nomeFuncao}`, {
          stdio: 'inherit',
          cwd: rootDir,
        });
        logSuccess(`Edge Function "${nomeFuncao}" deployada com sucesso (método alternativo)!`);
        return { sucesso: true, erro: null };
      } catch (altErr) {
        return { sucesso: false, erro: `Deploy falhou: ${altErr.message}` };
      }
    }
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

// Main
async function main() {
  logStep('DEPLOY AUTOMÁTICO DAS EDGE FUNCTIONS');
  
  log(`\n📋 Configuração:`, 'blue');
  log(`   URL: ${supabaseUrl}`, 'blue');
  log(`   Project Ref: ${projectRef}`, 'blue');
  log(`   Service Role: ✅ Configurada`, 'green');
  log('');

  // Verificar/Instalar Supabase CLI
  logStep('Verificando Supabase CLI');
  const cliInstalado = await instalarSupabaseCLI();
  if (!cliInstalado) {
    logError('Não é possível continuar sem Supabase CLI');
    process.exit(1);
  }

  // Lista completa de todas as Edge Functions do projeto
  logStep('Fazendo Deploy das Edge Functions');
  
  const edgeFunctions = [
    'bloquear-usuario',
    'criar-usuario-admin',
    'atualizar-usuario-admin',
    'excluir-usuario'
  ];
  
  logInfo(`Encontradas ${edgeFunctions.length} Edge Functions para deploy\n`);
  
  const resultados = [];
  
  for (const func of edgeFunctions) {
    const resultado = await deployEdgeFunction(func);
    resultados.push({ nome: func, ...resultado });
    
    // Pequena pausa entre deploys
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo Final
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 RESUMO DO DEPLOY', 'magenta');
  log('='.repeat(70), 'cyan');
  
  let sucesso = 0;
  let falhas = 0;
  
  resultados.forEach((func) => {
    if (func.sucesso) {
      log(`   ✅ ${func.nome}`, 'green');
      sucesso++;
    } else {
      log(`   ❌ ${func.nome}: ${func.erro}`, 'red');
      falhas++;
    }
  });

  log(`\n✅ Sucesso: ${sucesso}/${edgeFunctions.length}`, sucesso === edgeFunctions.length ? 'green' : 'yellow');
  if (falhas > 0) {
    log(`❌ Falhas: ${falhas}/${edgeFunctions.length}`, 'red');
  }

  log('\n' + '='.repeat(70), 'cyan');
  
  if (sucesso === edgeFunctions.length) {
    log('✅ Todas as Edge Functions foram deployadas com sucesso!', 'green');
    log('='.repeat(70), 'cyan');
  } else {
    log('⚠️  Algumas Edge Functions falharam no deploy', 'yellow');
    log('='.repeat(70), 'cyan');
    log('\n💡 Dica: Verifique os erros acima e tente novamente');
    process.exit(1);
  }
}

main().catch((err) => {
  logError(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});

