#!/usr/bin/env node

/**
 * Script de Configuração Automática - Produtos e Loja Pública
 * 
 * Este script prepara tudo para você executar no Supabase Dashboard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Script de Configuração - Produtos e Loja Pública\n');
console.log('=' .repeat(60));
console.log('Este script vai preparar tudo para você!\n');

// Caminhos dos arquivos (relativos à raiz do projeto)
const rootDir = path.resolve(__dirname, '..');
const scriptDatabase = path.join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql');
const scriptStorage = path.join(rootDir, 'supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql');

// Verificar se os arquivos existem
if (!fs.existsSync(scriptDatabase)) {
  console.error('❌ Arquivo SCRIPT_COMPLETO_DATABASE.sql não encontrado!');
  process.exit(1);
}

if (!fs.existsSync(scriptStorage)) {
  console.error('❌ Arquivo SCRIPT_COMPLETO_STORAGE.sql não encontrado!');
  process.exit(1);
}

// Ler conteúdo dos scripts
const databaseSQL = fs.readFileSync(scriptDatabase, 'utf-8');
const storageSQL = fs.readFileSync(scriptStorage, 'utf-8');

console.log('✅ Arquivos encontrados!\n');

// Criar arquivo HTML com interface amigável
const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuração Supabase - Produtos e Loja Pública</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .content { padding: 30px; }
    .step {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    .step h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 22px;
    }
    .step-number {
      display: inline-block;
      background: #667eea;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      margin-right: 10px;
      font-weight: bold;
    }
    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s;
    }
    .copy-btn:hover { background: #5568d3; }
    .copy-btn.copied { background: #10b981; }
    .instructions {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .instructions ol { margin-left: 20px; margin-top: 10px; }
    .instructions li { margin-bottom: 8px; }
    .success { background: #d4edda; border-color: #28a745; color: #155724; }
    .warning { background: #fff3cd; border-color: #ffc107; color: #856404; }
    .btn-link {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 10px;
      transition: background 0.3s;
    }
    .btn-link:hover { background: #5568d3; }
    .checklist {
      list-style: none;
      margin-left: 0;
    }
    .checklist li {
      padding: 8px 0;
      padding-left: 30px;
      position: relative;
    }
    .checklist li:before {
      content: "☐";
      position: absolute;
      left: 0;
      font-size: 20px;
    }
    .checklist li.checked:before {
      content: "✅";
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Configuração Supabase</h1>
      <p>Produtos e Loja Pública - Siga os 3 passos abaixo</p>
    </div>
    <div class="content">
      
      <!-- PASSO 1 -->
      <div class="step">
        <h2><span class="step-number">1</span>Executar Migration do Banco de Dados</h2>
        <div class="instructions warning">
          <strong>⚠️ Importante:</strong> Execute este passo primeiro!
        </div>
        <ol>
          <li>Acesse <a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a></li>
          <li>Selecione seu projeto</li>
          <li>Vá para <strong>SQL Editor</strong></li>
          <li>Clique em <strong>"New query"</strong></li>
          <li>Copie o script SQL abaixo (botão "Copiar")</li>
          <li>Cole no editor SQL</li>
          <li>Clique em <strong>"Run"</strong> ou pressione <code>Ctrl+Enter</code></li>
          <li>Aguarde a mensagem de sucesso</li>
        </ol>
        <div class="code-block">
          <button class="copy-btn" onclick="copyToClipboard('sql1')">Copiar</button>
          <pre id="sql1">${databaseSQL}</pre>
        </div>
      </div>

      <!-- PASSO 2 -->
      <div class="step">
        <h2><span class="step-number">2</span>Criar Buckets do Storage</h2>
        <div class="instructions warning">
          <strong>⚠️ Importante:</strong> Execute este passo manualmente no Dashboard!
        </div>
        <ol>
          <li>Ainda no <strong>Supabase Dashboard</strong>, vá para <strong>Storage</strong></li>
          <li>Clique em <strong>"New bucket"</strong></li>
          <li>Crie o primeiro bucket:
            <ul>
              <li><strong>Name:</strong> <code>produtos</code></li>
              <li><strong>Public bucket:</strong> ✅ <strong>SIM</strong> (marque esta opção!)</li>
            </ul>
          </li>
          <li>Clique em <strong>"Create bucket"</strong></li>
          <li>Clique novamente em <strong>"New bucket"</strong></li>
          <li>Crie o segundo bucket:
            <ul>
              <li><strong>Name:</strong> <code>logos-revendas</code></li>
              <li><strong>Public bucket:</strong> ✅ <strong>SIM</strong> (marque esta opção!)</li>
            </ul>
          </li>
          <li>Clique em <strong>"Create bucket"</strong></li>
        </ol>
        <div class="instructions success">
          <strong>✅ Verificação:</strong> Você deve ver 2 buckets na lista: "produtos" e "logos-revendas"
        </div>
      </div>

      <!-- PASSO 3 -->
      <div class="step">
        <h2><span class="step-number">3</span>Configurar Políticas RLS do Storage</h2>
        <div class="instructions warning">
          <strong>⚠️ Importante:</strong> Execute este passo APÓS criar os buckets!
        </div>
        <ol>
          <li>Volte para <strong>SQL Editor</strong> no Supabase Dashboard</li>
          <li>Clique em <strong>"New query"</strong></li>
          <li>Copie o script SQL abaixo (botão "Copiar")</li>
          <li>Cole no editor SQL</li>
          <li>Clique em <strong>"Run"</strong> ou pressione <code>Ctrl+Enter</code></li>
          <li>Aguarde a mensagem de sucesso</li>
        </ol>
        <div class="code-block">
          <button class="copy-btn" onclick="copyToClipboard('sql2')">Copiar</button>
          <pre id="sql2">${storageSQL}</pre>
        </div>
      </div>

      <!-- Checklist Final -->
      <div class="step">
        <h2>✅ Checklist Final</h2>
        <div class="instructions">
          <ul class="checklist">
            <li>Tabela <code>produtos</code> criada</li>
            <li>Campos <code>link_publico</code>, <code>nome_publico</code>, <code>logo_url</code> existem em <code>revendas</code></li>
            <li>Bucket <code>produtos</code> criado e público</li>
            <li>Bucket <code>logos-revendas</code> criado e público</li>
            <li>Políticas RLS do Storage configuradas</li>
          </ul>
        </div>
      </div>

      <!-- Links Úteis -->
      <div class="step">
        <h2>🔗 Links Úteis</h2>
        <a href="https://supabase.com/dashboard" target="_blank" class="btn-link">Abrir Supabase Dashboard</a>
        <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" class="btn-link">Abrir SQL Editor</a>
        <a href="https://supabase.com/dashboard/project/_/storage" target="_blank" class="btn-link">Abrir Storage</a>
      </div>

    </div>
  </div>

  <script>
    function copyToClipboard(id) {
      const pre = document.getElementById(id);
      const text = pre.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        alert('Erro ao copiar. Selecione o texto manualmente.');
      });
    }
  </script>
</body>
</html>`;

// Salvar arquivo HTML
const htmlPath = path.join(rootDir, 'CONFIGURAR_SUPABASE.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

console.log('✅ Arquivo HTML criado com sucesso!');
console.log(`\n📄 Abra o arquivo: ${htmlPath}`);
console.log('\nOu execute no terminal:');
console.log(`   start ${htmlPath.replace(/\\/g, '/')}`);
console.log('\n' + '='.repeat(60));
console.log('\n✨ Próximos passos:');
console.log('1. Abra o arquivo HTML no navegador');
console.log('2. Siga as instruções passo a passo');
console.log('3. Copie e cole os scripts SQL no Supabase Dashboard');
console.log('\n🎉 Tudo pronto para configurar!\n');

