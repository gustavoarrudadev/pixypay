-- Migration: Sistema de Convites para Colaboradores
-- Data: 2025-01-15
-- Descrição: Cria sistema completo de colaboradores com permissões granulares

-- ============================================
-- 1. ATUALIZAR TABELA usuarios PARA SUPORTAR NOVAS ROLES
-- ============================================

-- Remover constraint antiga
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;

-- Adicionar nova constraint com as novas roles
ALTER TABLE usuarios ADD CONSTRAINT usuarios_role_check 
  CHECK (role IN ('admin', 'colaborador_admin', 'revenda', 'colaborador_revenda', 'cliente'));

-- ============================================
-- 2. CRIAR TABELA colaboradores
-- ============================================

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_colaborador TEXT NOT NULL CHECK (tipo_colaborador IN ('admin', 'revenda')),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE, -- NULL se tipo_colaborador = 'admin'
  criado_por UUID NOT NULL REFERENCES usuarios(id), -- Quem criou o convite
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que revenda_id seja obrigatório para colaboradores de revenda
  CONSTRAINT check_revenda_id CHECK (
    (tipo_colaborador = 'revenda' AND revenda_id IS NOT NULL) OR
    (tipo_colaborador = 'admin' AND revenda_id IS NULL)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_usuario_id ON colaboradores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_revenda_id ON colaboradores(revenda_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo ON colaboradores(tipo_colaborador);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON colaboradores(ativo);

-- Garantir unicidade: um usuário só pode ser colaborador de uma revenda específica
CREATE UNIQUE INDEX IF NOT EXISTS unique_colaborador_revenda 
  ON colaboradores(usuario_id, revenda_id) 
  WHERE tipo_colaborador = 'revenda';

-- Garantir unicidade: um usuário só pode ser colaborador admin uma vez
CREATE UNIQUE INDEX IF NOT EXISTS unique_colaborador_admin 
  ON colaboradores(usuario_id) 
  WHERE tipo_colaborador = 'admin';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. CRIAR TABELA permissoes_colaborador
-- ============================================

CREATE TABLE IF NOT EXISTS permissoes_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  funcionalidade TEXT NOT NULL,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir unicidade: uma funcionalidade por colaborador
  CONSTRAINT unique_funcionalidade_colaborador UNIQUE (colaborador_id, funcionalidade)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_permissoes_colaborador_id ON permissoes_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_funcionalidade ON permissoes_colaborador(funcionalidade);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_permissoes_colaborador_updated_at
  BEFORE UPDATE ON permissoes_colaborador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. HABILITAR RLS
-- ============================================

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_colaborador ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLÍTICAS RLS PARA colaboradores
-- ============================================

-- Colaboradores podem ver seus próprios dados
CREATE POLICY "Colaboradores podem ver seus próprios dados"
  ON colaboradores FOR SELECT
  USING (auth.uid() = usuario_id);

-- Admins podem ver todos os colaboradores admin
CREATE POLICY "Admins podem ver colaboradores admin"
  ON colaboradores FOR SELECT
  USING (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem ver seus próprios colaboradores
CREATE POLICY "Revendas podem ver seus colaboradores"
  ON colaboradores FOR SELECT
  USING (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- Admins podem criar colaboradores admin
CREATE POLICY "Admins podem criar colaboradores admin"
  ON colaboradores FOR INSERT
  WITH CHECK (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem criar seus colaboradores
CREATE POLICY "Revendas podem criar seus colaboradores"
  ON colaboradores FOR INSERT
  WITH CHECK (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- Admins podem atualizar colaboradores admin
CREATE POLICY "Admins podem atualizar colaboradores admin"
  ON colaboradores FOR UPDATE
  USING (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem atualizar seus colaboradores
CREATE POLICY "Revendas podem atualizar seus colaboradores"
  ON colaboradores FOR UPDATE
  USING (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- Admins podem deletar colaboradores admin
CREATE POLICY "Admins podem deletar colaboradores admin"
  ON colaboradores FOR DELETE
  USING (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem deletar seus colaboradores
CREATE POLICY "Revendas podem deletar seus colaboradores"
  ON colaboradores FOR DELETE
  USING (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- 6. POLÍTICAS RLS PARA permissoes_colaborador
-- ============================================

-- Colaboradores podem ver suas próprias permissões
CREATE POLICY "Colaboradores podem ver suas permissões"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores 
      WHERE id = permissoes_colaborador.colaborador_id 
      AND usuario_id = auth.uid()
    )
  );

-- Admins podem ver permissões de colaboradores admin
CREATE POLICY "Admins podem ver permissões de colaboradores admin"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'admin'
      AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Revendas podem ver permissões de seus colaboradores
CREATE POLICY "Revendas podem ver permissões de seus colaboradores"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN revendas r ON c.revenda_id = r.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'revenda'
      AND r.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar permissões de colaboradores admin
CREATE POLICY "Admins podem gerenciar permissões admin"
  ON permissoes_colaborador FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'admin'
      AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'admin'
      AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Revendas podem gerenciar permissões de seus colaboradores
CREATE POLICY "Revendas podem gerenciar permissões de seus colaboradores"
  ON permissoes_colaborador FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN revendas r ON c.revenda_id = r.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'revenda'
      AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN revendas r ON c.revenda_id = r.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'revenda'
      AND r.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. FUNÇÕES RPC
-- ============================================

-- Função para verificar permissão de colaborador
CREATE OR REPLACE FUNCTION public.verificar_permissao_colaborador(
  p_usuario_id UUID,
  p_funcionalidade TEXT,
  p_acao TEXT -- 'visualizar', 'criar', 'editar', 'excluir'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_tem_permissao BOOLEAN := false;
  v_role TEXT;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO v_role
  FROM usuarios
  WHERE id = p_usuario_id;

  -- Se for admin ou revenda principal, tem todas as permissões
  IF v_role IN ('admin', 'revenda') THEN
    RETURN true;
  END IF;

  -- Verificar permissão específica do colaborador
  SELECT CASE p_acao
    WHEN 'visualizar' THEN pode_visualizar
    WHEN 'criar' THEN pode_criar
    WHEN 'editar' THEN pode_editar
    WHEN 'excluir' THEN pode_excluir
    ELSE false
  END INTO v_tem_permissao
  FROM permissoes_colaborador pc
  JOIN colaboradores c ON pc.colaborador_id = c.id
  WHERE c.usuario_id = p_usuario_id
    AND pc.funcionalidade = p_funcionalidade
    AND c.ativo = true;

  RETURN COALESCE(v_tem_permissao, false);
END;
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.verificar_permissao_colaborador(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_permissao_colaborador(UUID, TEXT, TEXT) TO anon;

-- Função para listar colaboradores admin
CREATE OR REPLACE FUNCTION public.listar_colaboradores_admin()
RETURNS TABLE (
  id UUID,
  usuario_id UUID,
  nome_completo TEXT,
  email TEXT,
  ativo BOOLEAN,
  criado_em TIMESTAMPTZ,
  criado_por_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual em uma variável local
  v_current_user_id := auth.uid();
  
  -- Verificar se é admin usando a variável local
  IF NOT EXISTS (
    SELECT 1 
    FROM usuarios 
    WHERE usuarios.id = v_current_user_id 
    AND usuarios.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem listar colaboradores admin';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.usuario_id,
    u.nome_completo,
    u.email,
    c.ativo,
    c.criado_em,
    criador.nome_completo as criado_por_nome
  FROM colaboradores c
  JOIN usuarios u ON c.usuario_id = u.id
  LEFT JOIN usuarios criador ON c.criado_por = criador.id
  WHERE c.tipo_colaborador = 'admin'
  ORDER BY c.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_colaboradores_admin() TO authenticated;

-- Função para listar colaboradores de uma revenda
CREATE OR REPLACE FUNCTION public.listar_colaboradores_revenda(p_revenda_id UUID)
RETURNS TABLE (
  id UUID,
  usuario_id UUID,
  nome_completo TEXT,
  email TEXT,
  ativo BOOLEAN,
  criado_em TIMESTAMPTZ,
  criado_por_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual em uma variável local
  v_current_user_id := auth.uid();
  
  -- Verificar se é dono da revenda usando a variável local
  IF NOT EXISTS (
    SELECT 1 
    FROM revendas 
    WHERE revendas.id = p_revenda_id 
    AND revendas.user_id = v_current_user_id
  ) THEN
    RAISE EXCEPTION 'Apenas o dono da revenda pode listar colaboradores';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.usuario_id,
    u.nome_completo,
    u.email,
    c.ativo,
    c.criado_em,
    criador.nome_completo as criado_por_nome
  FROM colaboradores c
  JOIN usuarios u ON c.usuario_id = u.id
  LEFT JOIN usuarios criador ON c.criado_por = criador.id
  WHERE c.tipo_colaborador = 'revenda'
    AND c.revenda_id = p_revenda_id
  ORDER BY c.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_colaboradores_revenda(UUID) TO authenticated;

-- Função para buscar permissões de um colaborador
CREATE OR REPLACE FUNCTION public.buscar_permissoes_colaborador(p_colaborador_id UUID)
RETURNS TABLE (
  funcionalidade TEXT,
  pode_visualizar BOOLEAN,
  pode_criar BOOLEAN,
  pode_editar BOOLEAN,
  pode_excluir BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual em uma variável local
  v_current_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    pc.funcionalidade,
    pc.pode_visualizar,
    pc.pode_criar,
    pc.pode_editar,
    pc.pode_excluir
  FROM permissoes_colaborador pc
  JOIN colaboradores c ON pc.colaborador_id = c.id
  WHERE pc.colaborador_id = p_colaborador_id
    AND (
      -- Colaborador pode ver suas próprias permissões
      c.usuario_id = v_current_user_id
      OR
      -- Admin pode ver permissões de colaboradores admin
      (c.tipo_colaborador = 'admin' AND EXISTS (
        SELECT 1 
        FROM usuarios 
        WHERE usuarios.id = v_current_user_id 
        AND usuarios.role = 'admin'
      ))
      OR
      -- Revenda pode ver permissões de seus colaboradores
      (c.tipo_colaborador = 'revenda' AND EXISTS (
        SELECT 1 
        FROM revendas 
        WHERE revendas.id = c.revenda_id 
        AND revendas.user_id = v_current_user_id
      ))
    )
  ORDER BY pc.funcionalidade;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_permissoes_colaborador(UUID) TO authenticated;

-- Comentários nas tabelas
COMMENT ON TABLE colaboradores IS 'Armazena informações sobre colaboradores do sistema (admin e revenda)';
COMMENT ON TABLE permissoes_colaborador IS 'Armazena permissões granulares por funcionalidade para cada colaborador';
COMMENT ON COLUMN colaboradores.tipo_colaborador IS 'Tipo: admin ou revenda';
COMMENT ON COLUMN colaboradores.revenda_id IS 'ID da revenda (obrigatório se tipo_colaborador = revenda)';
COMMENT ON COLUMN permissoes_colaborador.funcionalidade IS 'Nome da funcionalidade (ex: dashboard, pedidos, produtos)';
COMMENT ON COLUMN permissoes_colaborador.pode_visualizar IS 'Permite visualizar a funcionalidade';
COMMENT ON COLUMN permissoes_colaborador.pode_criar IS 'Permite criar registros na funcionalidade';
COMMENT ON COLUMN permissoes_colaborador.pode_editar IS 'Permite editar registros na funcionalidade';
COMMENT ON COLUMN permissoes_colaborador.pode_excluir IS 'Permite excluir registros na funcionalidade';

