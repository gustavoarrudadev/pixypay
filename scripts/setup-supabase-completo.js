#!/usr/bin/env node

/**
 * 🚀 Script de Setup Completo e Automatizado - Nova Conta Supabase
 * 
 * Este script automatiza TODO o processo de configuração de uma nova conta Supabase:
 * ✅ Executa todas as migrations automaticamente
 * ✅ Cria buckets do Storage automaticamente
 * ✅ Configura políticas RLS automaticamente
 * ✅ Faz deploy das Edge Functions automaticamente
 * ✅ Verifica se tudo está funcionando
 * 
 * USO:
 *   1. Configure apenas as variáveis de ambiente no .env
 *   2. Execute: npm run setup:supabase
 *   3. Pronto! Tudo será configurado automaticamente
 * 
 * REQUISITOS:
 *   - Node.js instalado
 *   - Variáveis de ambiente configuradas no .env
 *   - Supabase CLI instalado (será verificado e instalado se necessário)
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
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

function logStep(step, message) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`🚀 PASSO ${step}: ${message}`, 'magenta');
  log('='.repeat(70), 'cyan');
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

// Verificar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  logError('VITE_SUPABASE_URL ou SUPABASE_URL não encontrado no .env');
  logInfo('Configure no arquivo .env antes de executar este script');
  process.exit(1);
}

if (!supabaseAnonKey) {
  logError('VITE_SUPABASE_ANON_KEY ou SUPABASE_ANON_KEY não encontrado no .env');
  logInfo('Obtenha em: Supabase Dashboard > Settings > API > anon key');
  process.exit(1);
}

if (!supabaseServiceKey) {
  logError('SUPABASE_SERVICE_ROLE_KEY não encontrado no .env');
  logInfo('Esta chave é OBRIGATÓRIA para configuração automática');
  logInfo('Obtenha em: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Extrair project_ref da URL
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch ? projectRefMatch[1] : null;

if (!projectRef) {
  logError('Não foi possível extrair project_ref da URL do Supabase');
  logInfo('URL deve estar no formato: https://xxxxx.supabase.co');
  process.exit(1);
}

log('\n' + '='.repeat(70), 'cyan');
log('🚀 SETUP AUTOMATIZADO - NOVA CONTA SUPABASE', 'magenta');
log('='.repeat(70), 'cyan');
log(`\n📋 Configuração:`, 'blue');
log(`   URL: ${supabaseUrl}`, 'blue');
log(`   Project Ref: ${projectRef}`, 'blue');
log(`   Service Role: ✅ Configurada`, 'green');
log('');

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

// Executar SQL via Supabase CLI (método mais confiável)
async function executarSQL(sql, descricao = 'SQL') {
  // Método 1: Executar via Supabase CLI (mais confiável)
  if (verificarSupabaseCLI()) {
    logInfo(`Executando via Supabase CLI...`);
    
    // Criar arquivo temporário com SQL
    const tempFile = join(rootDir, '.temp-migration.sql');
    writeFileSync(tempFile, sql, 'utf-8');

    try {
      // Link do projeto primeiro (não bloqueia se já estiver linkado)
      try {
        execSync(`supabase link --project-ref ${projectRef} --password "${supabaseServiceKey}"`, {
          stdio: 'ignore',
          cwd: rootDir,
        });
      } catch (linkErr) {
        // Pode já estar linkado, tentar continuar
        logInfo('Projeto pode já estar linkado, continuando...');
      }

      // Executar SQL via CLI usando psql
      // Usar método direto via psql connection string
      const dbPassword = supabaseServiceKey; // Service role key funciona como password
      const dbUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
      
      // Tentar executar via psql se disponível
      try {
        execSync(`psql "${dbUrl}" -f "${tempFile}"`, {
          stdio: 'inherit',
          cwd: rootDir,
        });
        
        // Remover arquivo temporário
        try {
          require('fs').unlinkSync(tempFile);
        } catch {}
        
        return { sucesso: true, erro: null };
      } catch (psqlErr) {
        // Se psql não estiver disponível, usar método alternativo
        logInfo('psql não disponível, usando método alternativo...');
        
        // Método alternativo: usar supabase db execute via API
        // Criar arquivo de migration temporário
        const migrationsDir = join(rootDir, 'supabase', 'migrations');
        if (!existsSync(migrationsDir)) {
          require('fs').mkdirSync(migrationsDir, { recursive: true });
        }
        
        const migrationFile = join(migrationsDir, `999_temp_setup_${Date.now()}.sql`);
        writeFileSync(migrationFile, sql, 'utf-8');
        
        try {
          // Usar supabase db push para aplicar migration
          execSync(`supabase db push --db-url "${dbUrl}"`, {
            stdio: 'inherit',
            cwd: rootDir,
          });
          
          // Remover arquivos temporários
          try {
            require('fs').unlinkSync(tempFile);
            require('fs').unlinkSync(migrationFile);
          } catch {}
          
          return { sucesso: true, erro: null };
        } catch (pushErr) {
          // Remover arquivos temporários
          try {
            require('fs').unlinkSync(tempFile);
            require('fs').unlinkSync(migrationFile);
          } catch {}
          
          throw pushErr;
        }
      }
    } catch (cliErr) {
      // Remover arquivo temporário
      try {
        require('fs').unlinkSync(tempFile);
      } catch {}
      
      // Método 2: Tentar via REST API como fallback
      logInfo('Tentando método alternativo via REST API...');
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql_query: sql }),
        });

        if (response.ok) {
          return { sucesso: true, erro: null };
        }

        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      } catch (apiErr) {
        return {
          sucesso: false,
          erro: `CLI: ${cliErr.message} | API: ${apiErr.message}`,
          sql,
        };
      }
    }
  }

  // Método 3: Tentar via REST API se CLI não disponível
  logWarning('Supabase CLI não disponível, tentando via REST API...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (response.ok) {
      return { sucesso: true, erro: null };
    }

    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  } catch (err) {
    return {
      sucesso: false,
      erro: err.message,
      sql,
    };
  }
}

// Criar bucket do Storage
async function criarBucket(nome, publico = true) {
  try {
    const { data, error } = await supabase.storage.createBucket(nome, {
      public: publico,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (error) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        return { sucesso: true, erro: null, jaExiste: true };
      }
      throw error;
    }

    return { sucesso: true, erro: null, jaExiste: false };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

// Verificar se bucket existe
async function verificarBucket(nomeBucket) {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return data.some((bucket) => bucket.name === nomeBucket);
  } catch (err) {
    return false;
  }
}

// Verificar se tabela existe
async function verificarTabela(nomeTabela) {
  try {
    const { data, error } = await supabase
      .from(nomeTabela)
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      return false;
    }
    return true;
  } catch (err) {
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
      // Tentar linkar o projeto (não bloqueia se já estiver linkado)
      execSync(`supabase link --project-ref ${projectRef}`, {
        stdio: 'ignore',
        cwd: rootDir,
        env: {
          ...process.env,
          SUPABASE_ACCESS_TOKEN: supabaseServiceKey, // Pode ser necessário
        },
      });
      logInfo(`Projeto linkado: ${projectRef}`);
    } catch (linkErr) {
      // Pode já estar linkado ou precisar de autenticação diferente
      logInfo('Tentando continuar com deploy (projeto pode já estar linkado)...');
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
  const resultados = {
    migrations: false,
    buckets: false,
    storageRLS: false,
    edgeFunctions: [],
  };

  try {
    // PASSO 1: Verificar/Instalar Supabase CLI
    logStep(1, 'Verificando Supabase CLI');
    
    const cliInstalado = await instalarSupabaseCLI();
    if (!cliInstalado) {
      logWarning('Continuando sem Supabase CLI. Algumas operações podem falhar.');
    }

    // PASSO 2: Executar Migrations
    logStep(2, 'Executando Migrations do Banco de Dados');

    // Método mais confiável: usar Supabase CLI para aplicar migrations
    if (verificarSupabaseCLI()) {
      logInfo('Usando Supabase CLI para aplicar migrations...');
      
      try {
        // Link do projeto
        try {
          execSync(`supabase link --project-ref ${projectRef} --password "${supabaseServiceKey}"`, {
            stdio: 'ignore',
            cwd: rootDir,
          });
          logSuccess('Projeto linkado com sucesso!');
        } catch (linkErr) {
          logInfo('Projeto pode já estar linkado, continuando...');
        }

        // Aplicar migrations via db push
        logInfo('Aplicando migrations...');
        execSync('supabase db push', {
          stdio: 'inherit',
          cwd: rootDir,
        });
        
        logSuccess('Migrations aplicadas com sucesso via CLI!');
        resultados.migrations = true;
      } catch (cliErr) {
        logWarning(`Erro ao aplicar via CLI: ${cliErr.message}`);
        logInfo('Tentando método alternativo...');
        
        // Método alternativo: executar script completo via SQL
        const databaseSQLPath = join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql');
        if (existsSync(databaseSQLPath)) {
          const databaseSQL = readFileSync(databaseSQLPath, 'utf-8');
          const resultadoDB = await executarSQL(databaseSQL, 'Database Migrations');
          
          if (resultadoDB.sucesso) {
            logSuccess('Migrations executadas com sucesso!');
            resultados.migrations = true;
          } else {
            logError(`Erro ao executar migrations: ${resultadoDB.erro}`);
            logWarning('⚠️  AÇÃO MANUAL NECESSÁRIA:');
            logInfo('Execute manualmente no Supabase Dashboard > SQL Editor');
            logInfo('Arquivo: supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql');
          }
        } else {
          logError('Arquivo SCRIPT_COMPLETO_DATABASE.sql não encontrado!');
        }
      }
    } else {
      // Sem CLI, tentar método alternativo
      logWarning('Supabase CLI não disponível, usando método alternativo...');
      
      const databaseSQLPath = join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql');
      if (existsSync(databaseSQLPath)) {
        const databaseSQL = readFileSync(databaseSQLPath, 'utf-8');
        const resultadoDB = await executarSQL(databaseSQL, 'Database Migrations');
        
        if (resultadoDB.sucesso) {
          logSuccess('Migrations executadas com sucesso!');
          resultados.migrations = true;
        } else {
          logError(`Erro ao executar migrations: ${resultadoDB.erro}`);
          logWarning('⚠️  AÇÃO MANUAL NECESSÁRIA:');
          logInfo('Execute manualmente no Supabase Dashboard > SQL Editor');
          logInfo('Arquivo: supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql');
        }
      } else {
        logError('Arquivo SCRIPT_COMPLETO_DATABASE.sql não encontrado!');
      }
    }

    // PASSO 3: Criar Buckets do Storage
    logStep(3, 'Criando Buckets do Storage');

    const buckets = [
      { nome: 'produtos', publico: true },
      { nome: 'logos-revendas', publico: true },
    ];

    let todosBucketsCriados = true;

    for (const bucket of buckets) {
      const existe = await verificarBucket(bucket.nome);
      
      if (existe) {
        logSuccess(`Bucket "${bucket.nome}" já existe`);
      } else {
        logInfo(`Criando bucket "${bucket.nome}"...`);
        const resultado = await criarBucket(bucket.nome, bucket.publico);
        
        if (resultado.sucesso) {
          if (resultado.jaExiste) {
            logSuccess(`Bucket "${bucket.nome}" já existe`);
          } else {
            logSuccess(`Bucket "${bucket.nome}" criado com sucesso!`);
          }
        } else {
          logError(`Erro ao criar bucket "${bucket.nome}": ${resultado.erro}`);
          todosBucketsCriados = false;
        }
      }
    }

    resultados.buckets = todosBucketsCriados;

    // PASSO 4: Configurar Políticas RLS do Storage
    logStep(4, 'Configurando Políticas RLS do Storage');

    const storageSQLPath = join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql');
    if (!existsSync(storageSQLPath)) {
      logWarning('Arquivo SCRIPT_COMPLETO_STORAGE.sql não encontrado');
    } else {
      const storageSQL = readFileSync(storageSQLPath, 'utf-8');
      logInfo('Configurando políticas RLS...');
      
      const resultadoStorage = await executarSQL(storageSQL, 'Storage RLS');
      
      if (resultadoStorage.sucesso) {
        logSuccess('Políticas RLS do Storage configuradas!');
        resultados.storageRLS = true;
      } else {
        logError(`Erro ao configurar RLS: ${resultadoStorage.erro}`);
        logWarning('Tente executar manualmente no Supabase Dashboard > SQL Editor');
        logInfo('Arquivo: supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql');
      }
    }

    // PASSO 5: Deploy Edge Functions
    logStep(5, 'Fazendo Deploy das Edge Functions');

    // Lista completa de todas as Edge Functions do projeto
    const edgeFunctions = [
      'bloquear-usuario',
      'criar-usuario-admin',
      'atualizar-usuario-admin',
      'excluir-usuario'
    ];
    
    logInfo(`Encontradas ${edgeFunctions.length} Edge Functions para deploy`);
    
    for (const func of edgeFunctions) {
      logInfo(`Processando "${func}"...`);
      const resultado = await deployEdgeFunction(func);
      
      if (resultado.sucesso) {
        logSuccess(`Edge Function "${func}" deployada com sucesso!`);
        resultados.edgeFunctions.push({ nome: func, sucesso: true });
      } else {
        logWarning(`Não foi possível fazer deploy de "${func}": ${resultado.erro}`);
        resultados.edgeFunctions.push({ nome: func, sucesso: false, erro: resultado.erro });
      }
    }

    // PASSO 6: Verificações Finais
    logStep(6, 'Verificando Configuração');

    const tabelasParaVerificar = [
      'usuarios',
      'revendas',
      'produtos',
      'pedidos',
      'parcelamentos',
      'transacoes_financeiras',
    ];

    log('\n📊 Verificando tabelas...\n');
    let tabelasOK = 0;
    for (const tabela of tabelasParaVerificar) {
      const existe = await verificarTabela(tabela);
      if (existe) {
        logSuccess(`Tabela "${tabela}" existe`);
        tabelasOK++;
      } else {
        logError(`Tabela "${tabela}" NÃO existe`);
      }
    }

    log('\n📦 Verificando buckets...\n');
    let bucketsOK = 0;
    for (const bucket of buckets) {
      const existe = await verificarBucket(bucket.nome);
      if (existe) {
        logSuccess(`Bucket "${bucket.nome}" existe`);
        bucketsOK++;
      } else {
        logError(`Bucket "${bucket.nome}" NÃO existe`);
      }
    }

    // Resumo Final
    log('\n' + '='.repeat(70), 'cyan');
    log('📋 RESUMO DA CONFIGURAÇÃO', 'magenta');
    log('='.repeat(70), 'cyan');
    
    log(`\n✅ Migrations: ${resultados.migrations ? 'OK' : 'FALHOU'}`, resultados.migrations ? 'green' : 'red');
    log(`✅ Buckets: ${resultados.buckets ? 'OK' : 'FALHOU'}`, resultados.buckets ? 'green' : 'red');
    log(`✅ Storage RLS: ${resultados.storageRLS ? 'OK' : 'FALHOU'}`, resultados.storageRLS ? 'green' : 'red');
    log(`✅ Tabelas verificadas: ${tabelasOK}/${tabelasParaVerificar.length}`, tabelasOK === tabelasParaVerificar.length ? 'green' : 'yellow');
    log(`✅ Buckets verificados: ${bucketsOK}/${buckets.length}`, bucketsOK === buckets.length ? 'green' : 'yellow');
    
    log('\n📦 Edge Functions:', 'blue');
    resultados.edgeFunctions.forEach((func) => {
      if (func.sucesso) {
        log(`   ✅ ${func.nome}`, 'green');
      } else {
        log(`   ⚠️  ${func.nome}: ${func.erro}`, 'yellow');
      }
    });

    // Próximos Passos
    log('\n' + '='.repeat(70), 'cyan');
    log('📋 PRÓXIMOS PASSOS (MANUAIS)', 'magenta');
    log('='.repeat(70), 'cyan');

    log('\n⚠️  AÇÃO NECESSÁRIA:', 'yellow');
    log('1. Configure URLs de redirecionamento no Auth:', 'blue');
    log('   - Acesse: Supabase Dashboard > Authentication > URL Configuration', 'blue');
    log('   - Site URL: http://localhost:5173 (ou sua URL de produção)', 'blue');
    log('   - Redirect URLs:', 'blue');
    log('     * http://localhost:5173/confirmar-email', 'blue');
    log('     * http://localhost:5173/redefinir-senha', 'blue');
    log('     * http://localhost:5173/magic-link-login', 'blue');

    if (resultados.edgeFunctions.some(f => !f.sucesso)) {
      log('\n2. Deploy manual de Edge Functions (se necessário):', 'blue');
      resultados.edgeFunctions.forEach((func) => {
        if (!func.sucesso) {
          log(`   - supabase functions deploy ${func.nome}`, 'blue');
        }
      });
    }

    log('\n3. Teste a aplicação:', 'blue');
    log('   - npm run dev', 'blue');
    log('   - Tente fazer login/registro', 'blue');
    log('   - Crie um produto e teste upload de imagem', 'blue');

    log('\n' + '='.repeat(70), 'cyan');
    log('✅ Setup concluído!', 'green');
    log('='.repeat(70), 'cyan');
    log('');

  } catch (err) {
    logError(`Erro fatal: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  logError(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});

