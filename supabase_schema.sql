-- ============================================================
-- SISME — Estrutura completa do banco de dados
-- Execute no SQL Editor do Supabase (painel > SQL Editor > New query)
-- Execute TUDO de uma vez
-- ============================================================


-- ============================================================
-- TABELA: escolas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.escolas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  codigo      TEXT NOT NULL UNIQUE,  -- ex: COLEGIO2025 (você cadastra manualmente)
  ativo       BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;

-- Escolas são lidas por qualquer usuário autenticado (para validar código no cadastro)
CREATE POLICY "escolas_leitura_publica" ON public.escolas
  FOR SELECT USING (true);

-- Apenas service_role pode inserir/editar escolas (você faz isso pelo painel do Supabase)
CREATE POLICY "escolas_escrita_service" ON public.escolas
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- TABELA: usuarios
-- Metadados de perfil por papel (aluno, psicologa, admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  papel       TEXT NOT NULL CHECK (papel IN ('aluno', 'psicologa', 'admin')),
  escola_id   UUID REFERENCES public.escolas(id),
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprio_perfil" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuario_insere_proprio_perfil" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- TABELA: alunos
-- Matrículas pré-cadastradas por você antes do aluno criar conta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alunos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       UUID NOT NULL REFERENCES public.escolas(id),
  matricula       TEXT NOT NULL,
  nome            TEXT,                          -- preenchido quando o aluno cria conta
  usuario_id      UUID REFERENCES auth.users(id), -- NULL até o aluno criar conta
  personagem      TEXT CHECK (personagem IN ('tina', 'leo')), -- escolhido no onboarding
  onboarding_ok   BOOLEAN DEFAULT false,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, matricula)                   -- garante 1 conta por matrícula por escola
);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas o próprio registro
CREATE POLICY "aluno_ve_proprio" ON public.alunos
  FOR SELECT USING (auth.uid() = usuario_id);

-- Aluno atualiza apenas o próprio (nome, personagem, onboarding_ok)
CREATE POLICY "aluno_atualiza_proprio" ON public.alunos
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Psicóloga vê alunos da mesma escola
CREATE POLICY "psicologa_ve_alunos_escola" ON public.alunos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.papel = 'psicologa'
        AND u.escola_id = alunos.escola_id
    )
  );

-- Permissão especial: durante o cadastro, o sistema precisa ler a matrícula
-- para validar antes do usuário existir. Isso é feito via service_role na Edge Function.
-- O anon key só lê escolas (para validar código da escola).
-- A vinculação usuario_id é feita pelo backend após o signUp.

CREATE INDEX IF NOT EXISTS idx_alunos_escola ON public.alunos(escola_id);
CREATE INDEX IF NOT EXISTS idx_alunos_usuario ON public.alunos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON public.alunos(escola_id, matricula);


-- ============================================================
-- TABELA: checkins
-- Check-in diário do aluno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id),
  escola_id   UUID NOT NULL REFERENCES public.escolas(id),
  humor       INTEGER NOT NULL CHECK (humor BETWEEN 1 AND 5),
  energia     INTEGER CHECK (energia BETWEEN 1 AND 5),
  nota        TEXT,                              -- campo livre opcional
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_ve_proprios_checkins" ON public.checkins
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_insere_checkin" ON public.checkins
  FOR INSERT WITH CHECK (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "psicologa_ve_checkins_escola" ON public.checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.papel = 'psicologa' AND u.escola_id = checkins.escola_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_checkins_aluno ON public.checkins(aluno_id);
CREATE INDEX IF NOT EXISTS idx_checkins_escola ON public.checkins(escola_id);
CREATE INDEX IF NOT EXISTS idx_checkins_criado ON public.checkins(criado_em DESC);


-- ============================================================
-- TABELA: conversas
-- Sessão de conversa com Tina ou Léo
-- Transcrição bruta NUNCA armazenada — apenas resumo de temas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        UUID NOT NULL REFERENCES public.alunos(id),
  escola_id       UUID NOT NULL REFERENCES public.escolas(id),
  personagem      TEXT NOT NULL CHECK (personagem IN ('tina', 'leo')),
  resumo_temas    TEXT,                          -- gerado pela IA ao encerrar sessão
  nivel_alerta    INTEGER DEFAULT 0 CHECK (nivel_alerta BETWEEN 0 AND 3),
  encerrada       BOOLEAN DEFAULT false,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  encerrada_em    TIMESTAMPTZ
);

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_ve_proprias_conversas" ON public.conversas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_cria_conversa" ON public.conversas
  FOR INSERT WITH CHECK (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_encerra_conversa" ON public.conversas
  FOR UPDATE USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "psicologa_ve_conversas_escola" ON public.conversas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.papel = 'psicologa' AND u.escola_id = conversas.escola_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_conversas_aluno ON public.conversas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_conversas_escola ON public.conversas(escola_id);
CREATE INDEX IF NOT EXISTS idx_conversas_alerta ON public.conversas(nivel_alerta) WHERE nivel_alerta > 0;


-- ============================================================
-- TABELA: trilhas
-- Trilhas de áudio cadastradas por escola
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trilhas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id   UUID REFERENCES public.escolas(id), -- NULL = trilha global
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  audio_url   TEXT NOT NULL,                     -- URL do Cloudflare R2
  texto_ancora TEXT,                             -- texto exibido durante o áudio
  duracao_seg INTEGER,
  ordem       INTEGER DEFAULT 0,
  ativo       BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trilhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_ve_trilhas" ON public.trilhas
  FOR SELECT USING (
    ativo = true AND (
      escola_id IS NULL OR
      escola_id IN (
        SELECT escola_id FROM public.alunos WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_trilhas_escola ON public.trilhas(escola_id);


-- ============================================================
-- TABELA: trilhas_acessadas
-- Registro de quando o aluno acessou cada trilha
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trilhas_acessadas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id),
  trilha_id   UUID NOT NULL REFERENCES public.trilhas(id),
  escola_id   UUID NOT NULL REFERENCES public.escolas(id),
  concluida   BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trilhas_acessadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_ve_proprias_trilhas" ON public.trilhas_acessadas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_registra_trilha" ON public.trilhas_acessadas
  FOR INSERT WITH CHECK (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_atualiza_trilha" ON public.trilhas_acessadas
  FOR UPDATE USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );


-- ============================================================
-- TABELA: alertas
-- Gerado automaticamente quando conversa atinge Nível 2 ou 3
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alertas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        UUID NOT NULL REFERENCES public.alunos(id),
  escola_id       UUID NOT NULL REFERENCES public.escolas(id),
  conversa_id     UUID REFERENCES public.conversas(id),
  nivel           INTEGER NOT NULL CHECK (nivel IN (2, 3)),
  descricao       TEXT,                          -- resumo gerado pela IA, sem transcrição
  resolvido       BOOLEAN DEFAULT false,
  resolvido_em    TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psicologa_ve_alertas_escola" ON public.alertas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.papel = 'psicologa' AND u.escola_id = alertas.escola_id
    )
  );

CREATE POLICY "psicologa_atualiza_alerta" ON public.alertas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.papel = 'psicologa' AND u.escola_id = alertas.escola_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_alertas_escola ON public.alertas(escola_id);
CREATE INDEX IF NOT EXISTS idx_alertas_nivel ON public.alertas(nivel, resolvido);
CREATE INDEX IF NOT EXISTS idx_alertas_criado ON public.alertas(criado_em DESC);


-- ============================================================
-- TABELA: contribuicoes_pais
-- Formulário trimestral preenchido pelos responsáveis
-- Visível apenas para a psicóloga, nunca para o aluno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contribuicoes_pais (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id),
  escola_id   UUID NOT NULL REFERENCES public.escolas(id),
  resp1       INTEGER CHECK (resp1 BETWEEN 1 AND 5),  -- pergunta fechada 1
  resp2       INTEGER CHECK (resp2 BETWEEN 1 AND 5),  -- pergunta fechada 2
  resp3       INTEGER CHECK (resp3 BETWEEN 1 AND 5),  -- pergunta fechada 3
  resp4       INTEGER CHECK (resp4 BETWEEN 1 AND 5),  -- pergunta fechada 4
  observacao  TEXT,                                   -- campo opcional
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contribuicoes_pais ENABLE ROW LEVEL SECURITY;

-- Pais inserem (identificados pelo aluno_id passado via link/código)
CREATE POLICY "pais_inserem_contribuicao" ON public.contribuicoes_pais
  FOR INSERT WITH CHECK (true);  -- validação adicional via Edge Function

-- Apenas psicóloga lê — aluno NUNCA acessa
CREATE POLICY "psicologa_ve_contribuicoes" ON public.contribuicoes_pais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.papel = 'psicologa' AND u.escola_id = contribuicoes_pais.escola_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_contrib_aluno ON public.contribuicoes_pais(aluno_id);


-- ============================================================
-- TABELA: anotacoes_psicologa
-- Notas clínicas — RLS restrito ao próprio psicólogo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anotacoes_psicologa (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologa_id    UUID NOT NULL REFERENCES auth.users(id),
  aluno_id        UUID NOT NULL REFERENCES public.alunos(id),
  escola_id       UUID NOT NULL REFERENCES public.escolas(id),
  conteudo        TEXT NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  atualizado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.anotacoes_psicologa ENABLE ROW LEVEL SECURITY;

-- Apenas a psicóloga que criou a anotação pode ver e editar
CREATE POLICY "psicologa_ve_proprias_anotacoes" ON public.anotacoes_psicologa
  FOR SELECT USING (auth.uid() = psicologa_id);

CREATE POLICY "psicologa_insere_anotacao" ON public.anotacoes_psicologa
  FOR INSERT WITH CHECK (auth.uid() = psicologa_id);

CREATE POLICY "psicologa_atualiza_anotacao" ON public.anotacoes_psicologa
  FOR UPDATE USING (auth.uid() = psicologa_id);

CREATE POLICY "psicologa_deleta_anotacao" ON public.anotacoes_psicologa
  FOR DELETE USING (auth.uid() = psicologa_id);

CREATE INDEX IF NOT EXISTS idx_anotacoes_psicologa ON public.anotacoes_psicologa(psicologa_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_aluno ON public.anotacoes_psicologa(aluno_id);


-- ============================================================
-- TABELA: registro_pessoal
-- Diário privado do aluno — nunca acessível por terceiros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registro_pessoal (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id),
  escola_id   UUID NOT NULL REFERENCES public.escolas(id),
  conteudo    TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.registro_pessoal ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio aluno acessa
CREATE POLICY "aluno_ve_proprio_registro" ON public.registro_pessoal
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_insere_registro" ON public.registro_pessoal
  FOR INSERT WITH CHECK (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_atualiza_registro" ON public.registro_pessoal
  FOR UPDATE USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE POLICY "aluno_deleta_registro" ON public.registro_pessoal
  FOR DELETE USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_registro_aluno ON public.registro_pessoal(aluno_id);


-- ============================================================
-- INSERÇÃO DE EXEMPLO
-- Escola de teste para você começar a desenvolver
-- Execute separado se quiser, não é obrigatório
-- ============================================================
-- INSERT INTO public.escolas (nome, codigo) VALUES ('Colégio Teste', 'TESTE2025');
-- INSERT INTO public.alunos (escola_id, matricula)
--   SELECT id, '000001' FROM public.escolas WHERE codigo = 'TESTE2025';
-- INSERT INTO public.alunos (escola_id, matricula)
--   SELECT id, '000002' FROM public.escolas WHERE codigo = 'TESTE2025';
