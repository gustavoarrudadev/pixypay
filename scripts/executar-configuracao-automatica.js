import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Ler scripts SQL
const databaseSQL = readFileSync(join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql'), 'utf-8');
const storageSQL = readFileSync(join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql'), 'utf-8');

console.log('🚀 Executando configuração automática via Supabase API...\n');

// Verificar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL ou SUPABASE_URL não encontrado no .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env');
  console.error('   Você precisa da Service Role Key para executar SQL e criar buckets.');
  console.error('   Obtenha em: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Criar cliente Supabase com service role (acesso admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executarSQL(sql) {
  try {
    console.log('📝 Executando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Tentar método alternativo via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return { data: await response.json(), error: null };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('❌ Erro ao executar SQL:', err.message);
    return { data: null, error: err };
  }
}

async function criarBucket(nome, publico = true) {
  try {
    console.log(`📦 Criando bucket "${nome}"...`);
    
    const { data, error } = await supabase.storage.createBucket(nome, {
      public: publico,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    if (error) {
      // Se bucket já existe, ignorar erro
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`   ✅ Bucket "${nome}" já existe`);
        return { data: { name: nome }, error: null };
      }
      throw error;
    }
    
    console.log(`   ✅ Bucket "${nome}" criado com sucesso`);
    return { data, error: null };
  } catch (err) {
    console.error(`   ❌ Erro ao criar bucket "${nome}":`, err.message);
    return { data: null, error: err };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PASSO 1: Executando migration do banco de dados\n');
  
  // Executar migration do banco
  const resultadoDB = await executarSQL(databaseSQL);
  
  if (resultadoDB.error) {
    console.error('\n❌ Erro ao executar migration do banco de dados');
    console.error('   Tente executar manualmente no Supabase Dashboard > SQL Editor');
    console.error('   Arquivo: supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql\n');
  } else {
    console.log('✅ Migration do banco de dados executada com sucesso!\n');
  }
  
  console.log('='.repeat(60));
  console.log('PASSO 2: Criando buckets do Storage\n');
  
  // Criar buckets
  const bucket1 = await criarBucket('produtos', true);
  const bucket2 = await criarBucket('logos-revendas', true);
  
  if (bucket1.error && !bucket1.error.message?.includes('already exists')) {
    console.error('\n⚠️  Não foi possível criar bucket "produtos"');
    console.error('   Crie manualmente em: Supabase Dashboard > Storage\n');
  }
  
  if (bucket2.error && !bucket2.error.message?.includes('already exists')) {
    console.error('\n⚠️  Não foi possível criar bucket "logos-revendas"');
    console.error('   Crie manualmente em: Supabase Dashboard > Storage\n');
  }
  
  console.log('='.repeat(60));
  console.log('PASSO 3: Configurando políticas RLS do Storage\n');
  
  // Executar políticas RLS do Storage
  const resultadoStorage = await executarSQL(storageSQL);
  
  if (resultadoStorage.error) {
    console.error('\n❌ Erro ao configurar políticas RLS do Storage');
    console.error('   Tente executar manualmente no Supabase Dashboard > SQL Editor');
    console.error('   Arquivo: supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql\n');
  } else {
    console.log('✅ Políticas RLS do Storage configuradas com sucesso!\n');
  }
  
  console.log('='.repeat(60));
  console.log('✅ Configuração concluída!\n');
  console.log('📋 Verificação:');
  console.log('   1. Verifique se a tabela "produtos" foi criada');
  console.log('   2. Verifique se os buckets foram criados');
  console.log('   3. Teste criar um produto no sistema\n');
}

main().catch(console.error);

