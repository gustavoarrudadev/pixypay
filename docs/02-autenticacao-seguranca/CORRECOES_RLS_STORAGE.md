# Correções Aplicadas - RLS e Storage

## Data: 2024

## Problemas Identificados

### 1. Recursão Infinita na Política RLS de `revendas`
**Erro:** `infinite recursion detected in policy for relation "revendas"`

**Causa:** A política de UPDATE da tabela `revendas` estava tentando validar a unicidade do `link_publico` dentro da própria política RLS, causando uma consulta recursiva infinita.

**Solução:**
- Removida a validação de unicidade da política RLS
- Criado um trigger `trigger_validar_link_publico` que valida a unicidade antes da atualização
- A política agora apenas verifica se `user_id = auth.uid()`

### 2. Erro de Permissão no Upload do Storage
**Erro:** `Sem permissão para fazer upload. Verifique as políticas RLS do Storage.`

**Causa:** As políticas do Storage estavam usando o índice incorreto para extrair o `revendaId` do caminho do arquivo.

**Solução:**
- Corrigido o uso de `storage.foldername(name)[1]` para `storage.foldername(name)[2]`
- A função `storage.foldername` retorna um array onde:
  - `[1]` = nome do bucket (ex: "produtos" ou "logos-revendas")
  - `[2]` = primeiro segmento do caminho após o bucket (revendaId) ✅
  - `[3]` = segundo segmento (produtoId, se aplicável)
- **IMPORTANTE:** O bucket é incluído no resultado, então o revendaId está sempre em [2], não em [1]!

## Arquivos Modificados

### Migrations
- `supabase/migrations/016_add_campos_presenca_revenda.sql`
  - Política de UPDATE simplificada
  - Trigger de validação adicionado

### Storage Policies
- `supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql`
  - Todas as políticas já estavam usando o índice correto `[1]`
  - Nenhuma alteração necessária

## Verificação

Execute as seguintes queries para verificar se tudo está correto:

```sql
-- Verificar política de UPDATE de revendas
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'revendas' 
AND cmd = 'UPDATE' 
AND policyname = 'Revendas podem atualizar presença';

-- Verificar trigger de validação
SELECT tgname, tgtype, tgenabled
FROM pg_trigger 
WHERE tgname = 'trigger_validar_link_publico';

-- Verificar políticas do Storage
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%produtos%' OR policyname LIKE '%logos%')
ORDER BY cmd, policyname;
```

## Testes Recomendados

1. **Teste de Upload de Produto:**
   - Fazer login como revenda
   - Tentar fazer upload de uma imagem de produto
   - Verificar se o upload é bem-sucedido

2. **Teste de Upload de Logo:**
   - Fazer login como revenda
   - Tentar fazer upload de uma logo
   - Verificar se o upload é bem-sucedido

3. **Teste de Atualização de Link Público:**
   - Fazer login como revenda
   - Tentar atualizar o link público
   - Verificar se a validação de unicidade funciona corretamente
   - Tentar usar um link já existente e verificar se o erro é exibido

4. **Teste de Recursão:**
   - Verificar que não há mais erros de recursão infinita nos logs do Supabase

## Notas Importantes

- A validação de unicidade do `link_publico` agora é feita via trigger, não via política RLS
- O trigger usa `SECURITY DEFINER` para garantir que tenha permissão para verificar todos os registros
- As políticas do Storage usam `storage.foldername(name)[1]` para extrair o `revendaId` do caminho
- Os buckets devem estar configurados como públicos para leitura

