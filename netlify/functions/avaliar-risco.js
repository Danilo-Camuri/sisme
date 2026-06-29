// netlify/functions/avaliar-risco.js
// ============================================================================
// ARIA — Avaliação de risco server-side (intermediário encadeado / "A+")
// ----------------------------------------------------------------------------
// Responsável técnico clínico: Danilo Camuri Teixeira Lopes | CRP 21/02554
//
// REGRA DE OURO (CEO): nenhuma mensagem do aluno pode chegar ao modelo
// conversacional (ARIA) sem antes passar por esta avaliação. O frontend
// ENCADEIA: só chama o proxy da ARIA depois que esta função retornar ok.
//
// Esta função:
//   1. Valida o JWT do Supabase (HS256, crypto nativo — sem dependência nova)
//   2. Resolve aluno_id / escola_id NO SERVIDOR a partir do token
//      (NUNCA confia em aluno_id vindo do cliente — defesa contra forja)
//   3. Roda heurística server-side (rede independente, sempre executa)
//   4. Roda classificador separado (Haiku) com contexto recente em memória
//   5. Combina níveis pela REGRA ASSIMÉTRICA: contexto só AUMENTA, nunca reduz
//   6. Grava crise_log minimizado em TODO turno
//   7. Se nível >= 2, grava alerta rico idempotente
//   8. Retorna o nível final ao frontend (que só então chama a ARIA)
//
// Modo degradado: se o classificador falhar, a heurística prevalece e
// classifier_error=true é gravado. NUNCA retorna nível 0 por falha silenciosa.
//
// O que esta função NÃO faz:
//   - Não persiste o texto bruto do aluno fora do mínimo necessário
//   - Não persiste o contexto recente (existe só em memória nesta execução)
//   - Não confia em nenhum identificador de aluno vindo do corpo da requisição
// ============================================================================

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ─── Config ────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY        = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_JWT_SECRET      = process.env.SUPABASE_JWT_SECRET;

const CLASSIFIER_MODEL   = 'claude-haiku-4-5-20251001';
const CLASSIFIER_VERSION = 'aria-risk-2026-06-classifier-v1';
const CLASSIFIER_TIMEOUT_MS = 8000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Heurística server-side ──────────────────────────────────────────────────
// Porte fiel de detectCrisisLevel (systemPrompts.js). Esta é a REDE
// INDEPENDENTE: roda sempre, mesmo se o classificador cair.
function heuristicaNivel(text) {
  const t = (text || '').toLowerCase();

  const nivel3 = [
    'quero me matar', 'vou me matar', 'acabar com tudo',
    'não quero mais viver', 'nao quero mais viver', 'me suicidar', 'tirar minha vida',
    'não quero mais existir', 'nao quero mais existir', 'melhor morrer',
    'me cortando agora', 'me cortei agora', 'tô me machucando agora', 'to me machucando agora',
  ];
  for (const p of nivel3) if (t.includes(p)) return { nivel: 3, termo: p };

  const nivel2 = [
    'se eu sumisse', 'se eu não existisse', 'se eu nao existisse', 'ninguém notaria', 'ninguem notaria',
    'não vejo sentido em continuar', 'nao vejo sentido em continuar', 'pra quê continuar', 'pra que continuar',
    'tanto faz se eu estiver aqui', 'desaparecer pra sempre',
    'me machucar', 'me cortar', 'inutilidade', 'não sirvo pra nada', 'nao sirvo pra nada',
    'pensando em me machucar', 'automutilação', 'automutilacao',
  ];
  for (const p of nivel2) if (t.includes(p)) return { nivel: 2, termo: p };

  const nivel1 = [
    'não tô nada', 'nao to nada', 'vazio', 'não sinto nada', 'nao sinto nada', 'tanto faz',
    'ninguém me entende', 'ninguem me entende', 'não tenho ninguém', 'nao tenho ninguem',
    'completamente sozinho', 'não vejo sentido', 'nao vejo sentido', 'não consigo mais', 'nao consigo mais',
    'tô no limite', 'to no limite', 'cansado de tudo', 'não aguento mais', 'nao aguento mais', 'desesperança', 'desesperanca',
  ];
  for (const p of nivel1) if (t.includes(p)) return { nivel: 1, termo: p };

  return { nivel: 0, termo: null };
}

// ─── Categoria a partir do nível e termo ─────────────────────────────────────
function categorizar(nivel, termo) {
  if (nivel >= 3) return 'risco_imediato';
  if (nivel === 2) {
    if (termo && (termo.includes('machucar') || termo.includes('cortar') || termo.includes('mutila'))) {
      return 'autolesao';
    }
    return 'ideacao';
  }
  if (nivel === 1) return 'sofrimento';
  return 'sem_risco';
}

// ─── Validação de JWT Supabase (HS256) com crypto nativo ─────────────────────
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function validarJWT(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token ausente.' };
  }
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return { error: 'Token malformado.' };

  const [headerB64, payloadB64, signatureB64] = parts;

  // Recalcular a assinatura HS256 e comparar em tempo constante
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto
    .createHmac('sha256', SUPABASE_JWT_SECRET)
    .update(data)
    .digest();
  const received = base64UrlDecode(signatureB64);

  if (expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)) {
    return { error: 'Assinatura inválida.' };
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    return { error: 'Payload inválido.' };
  }

  // Expiração
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { error: 'Token expirado.' };
  }
  // O subject é o auth.uid() — a identidade real do usuário
  if (!payload.sub) return { error: 'Token sem subject.' };

  return { userId: payload.sub };
}

// ─── Classificador via Anthropic (camada 2) ──────────────────────────────────
async function classificar(mensagemAtual, contextoRecente) {
  const contextoTexto = (contextoRecente || [])
    .map(m => `${m.role === 'user' ? 'Aluno' : 'ARIA'}: ${m.content}`)
    .join('\n');

  const system = `Você é um classificador de risco psicoemocional para uma plataforma de apoio a adolescentes (15-18 anos). Avalie APENAS o risco na ÚLTIMA mensagem do aluno, usando o contexto recente para entender escalada.

Níveis:
0 = sem risco aparente
1 = sofrimento/atenção (desânimo, solidão, cansaço emocional)
2 = alerta (ideação passiva, automutilação, desesperança grave, "queria sumir")
3 = risco imediato (ideação suicida ativa, plano, automutilação em curso)

Responda SOMENTE com JSON, sem markdown, sem texto antes ou depois:
{"nivel": <0-3>, "categoria": "<sem_risco|sofrimento|ideacao|autolesao|risco_imediato>", "justificativa": "<máx 12 palavras>"}`;

  const userContent = contextoTexto
    ? `Contexto recente:\n${contextoTexto}\n\nÚltima mensagem do aluno (avalie esta):\n${mensagemAtual}`
    : `Mensagem do aluno:\n${mensagemAtual}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        max_tokens: 100,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) return { error: `classifier_http_${res.status}` };

    const data = await res.json();
    const raw = (data.content || []).map(b => b.text || '').join('').trim();
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    if (typeof parsed.nivel !== 'number' || parsed.nivel < 0 || parsed.nivel > 3) {
      return { error: 'classifier_invalid_level' };
    }
    return {
      nivel: Math.round(parsed.nivel),
      categoria: parsed.categoria || null,
      justificativa: (parsed.justificativa || '').slice(0, 120),
    };
  } catch (e) {
    clearTimeout(timeout);
    return { error: e.name === 'AbortError' ? 'classifier_timeout' : `classifier_exception` };
  }
}

// ─── Hash de texto (auditoria sem reter o conteúdo bruto) ────────────────────
function hashTexto(texto) {
  return crypto.createHash('sha256').update(texto || '', 'utf8').digest('hex');
}

// ─── Handler ─────────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  // Checagem de configuração — falha fechada, nunca aberta
  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_JWT_SECRET) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Servidor não configurado.', degraded: true }),
    };
  }

  // 1. Validar JWT — identidade vem do token, não do corpo
  const auth = validarJWT(event.headers.authorization || event.headers.Authorization);
  if (auth.error) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: auth.error }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const mensagem        = (body.mensagem || '').toString();
  const contextoRecente = Array.isArray(body.contexto_recente) ? body.contexto_recente.slice(-6) : [];
  const conversaIdCli   = body.conversa_id || null; // verificado contra o dono abaixo
  const idempotencyKey  = (body.idempotency_key || '').toString().slice(0, 200) || null;

  if (!mensagem.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Mensagem vazia.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Resolver aluno_id/escola_id NO SERVIDOR a partir do userId do token.
  //    Qualquer aluno_id no body é ignorado — defesa contra forja (Teste 10).
  const { data: alunoRow, error: alunoErr } = await supabase
    .from('alunos')
    .select('id, escola_id')
    .eq('usuario_id', auth.userId)
    .maybeSingle();

  if (alunoErr || !alunoRow) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Aluno não resolvido.' }) };
  }
  const alunoId  = alunoRow.id;
  const escolaId = alunoRow.escola_id;

  // Se o cliente mandou conversa_id, confirmar que pertence a este aluno.
  let conversaId = null;
  if (conversaIdCli) {
    const { data: conv } = await supabase
      .from('conversas')
      .select('id, aluno_id')
      .eq('id', conversaIdCli)
      .maybeSingle();
    if (conv && conv.aluno_id === alunoId) conversaId = conv.id;
    // se não pertence, conversaId fica null — nunca grava cross-aluno
  }

  // 3. Heurística — rede independente, sempre roda
  const heur = heuristicaNivel(mensagem);

  // 4. Classificador — camada 2 (pode falhar; heurística cobre)
  const clf = await classificar(mensagem, contextoRecente);
  const classifierError = !!clf.error;

  // 5. REGRA ASSIMÉTRICA: o nível final é o MAIOR entre heurística e
  //    classificador. Contexto e modelo só AUMENTAM o risco, nunca reduzem.
  const nivelHeur  = heur.nivel;
  const nivelClf   = classifierError ? 0 : clf.nivel;
  const nivelFinal = Math.max(nivelHeur, nivelClf);

  const categoria = !classifierError && clf.categoria
    ? clf.categoria
    : categorizar(nivelFinal, heur.termo);

  // 6. Gravar crise_log SEMPRE (minimizado).
  //    Evidência textual só em nível >= 2, truncada.
  const trechoEvidencia = nivelFinal >= 2 ? mensagem.slice(0, 280) : null;

  const { error: logErr } = await supabase.from('crise_log').insert({
    aluno_id:           alunoId,
    escola_id:          escolaId,
    conversa_id:        conversaId,
    nivel_heuristica:   nivelHeur,
    nivel_modelo:       classifierError ? null : nivelClf,
    nivel_final:        nivelFinal,
    categoria,
    termo_heuristica:   heur.termo,
    classifier_version: CLASSIFIER_VERSION,
    classifier_error:   classifierError,
    texto_hash:         hashTexto(mensagem),
    trecho_evidencia:   trechoEvidencia,
  });
  if (logErr) console.error('[avaliar-risco] crise_log:', logErr.message);

  // 7. Alerta rico idempotente se nível >= 2
  let alertaGravado = false;
  if (nivelFinal >= 2) {
    const idem = idempotencyKey ||
      `${alunoId}:${conversaId || 'sem-conv'}:${hashTexto(mensagem).slice(0, 16)}`;

    const { error: alertaErr } = await supabase.from('alertas').insert({
      aluno_id:          alunoId,
      escola_id:         escolaId,
      conversa_id:       conversaId,
      nivel:             nivelFinal,
      categoria,
      status:            'aberto',
      recomendacao:      nivelFinal >= 3
        ? 'Risco imediato. Acionar protocolo de crise e contato com responsável/orientação agora.'
        : 'Alerta. Orientação escolar deve acolher e avaliar nas próximas 24h.',
      idempotency_key:   idem,
      criado_em:         new Date().toISOString(),
    });
    if (alertaErr) {
      // Violação de unique = duplicata idempotente; não é erro real
      if (alertaErr.code === '23505') {
        alertaGravado = true; // já existia — idempotência funcionou
      } else {
        console.error('[avaliar-risco] alerta:', alertaErr.message);
      }
    } else {
      alertaGravado = true;
    }
  }

  // 8. Resposta ao frontend. Só após isto o frontend chama a ARIA.
  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      nivel: nivelFinal,
      categoria,
      alerta: alertaGravado,
      degraded: classifierError,    // frontend sabe que rodou em modo degradado
    }),
  };
};
