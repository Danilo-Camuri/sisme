// netlify/functions/tcle-register.js
// Registra o aceite do TCLE com service_role key do Supabase.
// Roda no servidor — nunca expõe a service key nem o segredo de HMAC no frontend.
//
// ============================================================================
// CORREÇÕES DESTA VERSÃO (Item 6 — varredura transversal, Camada 1):
//
// 1) DESTINO: gravava em `tcle_registros`, tabela renomeada para `consentimentos`
//    na migration 003. Estava 100% quebrada em produção (toda tentativa falhava).
//    Corrigido: aponta para `consentimentos`, com os nomes de coluna atuais.
//
// 2) ENV VAR: lia `SUPABASE_SERVICE_KEY`, mas a variável configurada no Netlify
//    é `SUPABASE_SERVICE_ROLE_KEY`. Corrigido.
//
// 3) ESCRITA ÀS CEGAS: o PATCH manual em alunos.tcle_assinado não checava
//    resposta, não filtrava por escola (risco de marcar aluno errado em escolas
//    com matrícula coincidente), e o endpoint reportava { ok: true } ao
//    responsável mesmo se a marcação falhasse. REMOVIDO. O trigger
//    `marcar_tcle` (migration 003) já faz essa marcação, validando que a
//    escola do consentimento bate com a do aluno antes de marcar. Uma fonte,
//    uma verdade. Se o insert em `consentimentos` tiver sucesso, o trigger
//    cuida do resto — e se o trigger falhar (ex.: aluno_id não bate com
//    nenhum aluno), o insert inteiro é revertido pelo Postgres (mesma
//    transação), então não há mais como reportar sucesso falso.
//
// 4) HMAC DO CPF NO SERVIDOR: antes, o frontend (TCLEPage.jsx) calculava
//    SHA-256 do CPF no navegador e mandava o hash pronto — um hash sem
//    segredo que veio do cliente não é confiável (CPF tem universo pequeno,
//    SHA-256 simples é quebrável por força bruta/dicionário). Agora o CPF
//    cru chega via HTTPS e o HMAC-SHA256 é calculado AQUI, com um segredo
//    (TCLE_HASH_SECRET) que nunca sai do servidor. O CPF em texto puro NUNCA
//    é gravado, nunca é logado, e existe só durante esta execução.
// ============================================================================
//
// Recebe POST com JSON:
// { escola_codigo, escola_id, aluno_matricula, aluno_id,
//   responsavel_nome, responsavel_cpf, hash_documento,
//   bloco_a_aceito, bloco_b_aceito, bloco_c_aceito }
//
// responsavel_cpf: CPF em texto puro (só dígitos ou formatado), trafega
// por HTTPS até aqui. NUNCA é persistido — só o HMAC é gravado.
//
// Retorna { ok: true } ou { error: "mensagem" }

const crypto = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function hmacCPF(cpfDigits, secret) {
  return crypto.createHmac('sha256', secret).update(cpfDigits).digest('hex');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  const supabaseUrl  = process.env.SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashSecret    = process.env.TCLE_HASH_SECRET;

  // Falha fechada: sem segredo de hash, não processamos CPF nenhum.
  if (!supabaseUrl || !serviceKey || !hashSecret) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Servidor não configurado.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

  const {
    escola_codigo, escola_id, aluno_matricula, aluno_id,
    responsavel_nome, responsavel_cpf, hash_documento,
    bloco_a_aceito, bloco_b_aceito, bloco_c_aceito,
  } = body;

  // Validação básica — nenhum log abaixo inclui responsavel_cpf
  if (!escola_codigo || !aluno_matricula || !responsavel_nome || !responsavel_cpf || !hash_documento) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Campos obrigatórios ausentes.' }) };
  }
  if (!bloco_a_aceito || !bloco_b_aceito || !bloco_c_aceito) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Todos os blocos precisam ser aceitos.' }) };
  }

  const cpfDigits = String(responsavel_cpf).replace(/\D/g, '');
  if (cpfDigits.length !== 11 || /^(\d)\1+$/.test(cpfDigits)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'CPF inválido.' }) };
  }

  // HMAC calculado aqui, com segredo que nunca sai do servidor.
  // cpfDigits some do escopo ao fim da função; nunca é persistido nem logado.
  const responsavelDocHash = hmacCPF(cpfDigits, hashSecret);

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['client-ip']
    || 'desconhecido';
  const userAgent = event.headers['user-agent'] || '';

  try {
    // Checagem de duplicata NO SERVIDOR (service_role tem acesso; o cliente
    // anônimo não pode ler consentimentos por LGPD). Se já existe autorização
    // válida (assinada e não revogada) para esta matrícula+escola, recusa
    // antes de inserir — evita consentimento duplicado.
    const dupUrl = `${supabaseUrl}/rest/v1/consentimentos`
      + `?aluno_matricula=eq.${encodeURIComponent(aluno_matricula)}`
      + `&codigo_escola=eq.${encodeURIComponent(escola_codigo)}`
      + `&tcle_assinado=eq.true`
      + `&revogado=eq.false`
      + `&select=id&limit=1`;

    const dupRes = await fetch(dupUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    });

    if (dupRes.ok) {
      const existentes = await dupRes.json();
      if (Array.isArray(existentes) && existentes.length > 0) {
        return {
          statusCode: 409,
          headers: CORS,
          body: JSON.stringify({ error: 'Esta matrícula já possui autorização registrada.' }),
        };
      }
    } else {
      // Se a checagem de duplicata falhar, NÃO seguimos às cegas — recusamos.
      // Melhor pedir para tentar de novo do que arriscar duplicata silenciosa.
      const err = await dupRes.text();
      console.error('[tcle-register] checagem de duplicata falhou:', err);
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: 'Não foi possível validar a autorização. Tente novamente.' }),
      };
    }

    // Inserir em `consentimentos` (evolução de tcle_registros, migration 003).
    // O trigger marcar_tcle cuida de marcar alunos.tcle_assinado = true,
    // validando que a escola do consentimento bate com a do aluno — e se
    // a validação falhar, o INSERT inteiro é revertido (mesma transação),
    // então não há caminho de sucesso parcial.
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/consentimentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        codigo_escola:        escola_codigo,
        escola_id:             escola_id || null,
        aluno_matricula,
        aluno_id:               aluno_id || null,
        responsavel_nome,
        responsavel_doc_hash:  responsavelDocHash,
        ip_origem:              ip,
        user_agent:             userAgent,
        assinado_em:            new Date().toISOString(),
        versao_tcle:            'TCLE-ARIA-v1.0-junho2026',
        hash_documento,
        canal:                  'link_assinado',
        bloco_a_aceito,
        bloco_b_aceito,
        bloco_c_aceito,
        tcle_assinado:          true,
        revogado:               false,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      // err pode vir do Postgres (ex.: trigger rejeitou por escola não bater).
      // Não inclui CPF; seguro logar/retornar.
      console.error('[tcle-register] insert falhou:', err);
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Não foi possível registrar a autorização. Tente novamente ou contate a escola.' }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('[tcle-register] exceção:', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Erro ao registrar. Tente novamente.' }) };
  }
};
