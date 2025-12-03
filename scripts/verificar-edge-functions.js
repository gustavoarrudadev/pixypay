#!/usr/bin/env node

/**
 * 🔍 Script de Verificação das Edge Functions
 * 
 * Este script verifica se todas as Edge Functions estão deployadas e funcionando corretamente.
 * 
 * USO:
 *   node scripts/verificar-edge-functions.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const edgeFunctions = [
  'bloquear-usuario',
  'criar-usuario-admin',
  'atualizar-usuario-admin',
  'excluir-usuario'
];

async function verificarEdgeFunction(nomeFuncao) {
  try {
    // Tentar invocar a função com um payload de teste
    const { data, error } = await supabase.functions.invoke(nomeFuncao, {
      body: { teste: true }
    });

    // Se retornar erro 400 com mensagem específica, a função existe mas rejeitou o payload
    // Se retornar erro 404, a função não existe
    if (error) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { existe: false, erro: 'Função não encontrada (404)' };
      }
      if (error.message?.includes('400')) {
        return { existe: true, erro: null, mensagem: 'Função existe mas rejeitou payload de teste (esperado)' };
      }
      return { existe: true, erro: error.message };
    }

    return { existe: true, erro: null };
  } catch (err) {
    return { existe: false, erro: err.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICAÇÃO DAS EDGE FUNCTIONS');
  console.log('='.repeat(70));
  console.log(`\n📋 URL: ${supabaseUrl}`);
  console.log(`📋 Funções para verificar: ${edgeFunctions.length}\n`);

  const resultados = [];

  for (const func of edgeFunctions) {
    console.log(`Verificando "${func}"...`);
    const resultado = await verificarEdgeFunction(func);
    resultados.push({ nome: func, ...resultado });
    
    if (resultado.existe) {
      console.log(`  ✅ ${func} - Existe`);
      if (resultado.erro && !resultado.mensagem) {
        console.log(`     ⚠️  Aviso: ${resultado.erro}`);
      } else if (resultado.mensagem) {
        console.log(`     ℹ️  ${resultado.mensagem}`);
      }
    } else {
      console.log(`  ❌ ${func} - Não encontrada`);
      console.log(`     Erro: ${resultado.erro}`);
    }
    console.log('');
  }

  // Resumo
  console.log('='.repeat(70));
  console.log('📋 RESUMO');
  console.log('='.repeat(70));

  const existentes = resultados.filter(r => r.existe).length;
  const faltantes = resultados.filter(r => !r.existe).length;

  console.log(`\n✅ Deployadas: ${existentes}/${edgeFunctions.length}`);
  if (faltantes > 0) {
    console.log(`❌ Faltando: ${faltantes}/${edgeFunctions.length}`);
    console.log('\n⚠️  Ações necessárias:');
    resultados
      .filter(r => !r.existe)
      .forEach(r => {
        console.log(`   - Fazer deploy de "${r.nome}"`);
      });
    console.log('\nExecute: npm run deploy:functions');
  } else {
    console.log('\n✅ Todas as Edge Functions estão deployadas!');
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

