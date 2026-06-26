// netlify/functions/tcle-register.js
// Registra o aceite do TCLE com service_role key do Supabase.
// Roda no servidor — nunca expõe a service key no frontend.
//
// Recebe POST com JSON:
// { escola_codigo, escola_id, aluno_matricula, aluno_id,
//   responsavel_nome, responsavel_cpf_hash, hash_documento,
//   bloco_a_aceito, bloco_b_aceito, bloco_c_aceito }
//
// Retorna { ok: true } ou { error: "mensagem" }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Variáveis de ambiente não configuradas.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

  const {
    escola_codigo, escola_id, aluno_matricula, aluno_id,
    responsavel_nome, responsavel_cpf_hash, hash_documento,
    bloco_a_aceito, bloco_b_aceito, bloco_c_aceito,
  } = body;

  // Validação básica
  if (!escola_codigo || !aluno_matricula || !responsavel_nome || !responsavel_cpf_hash || !hash_documento) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Campos obrigatórios ausentes.' }) };
  }
  if (!bloco_a_aceito || !bloco_b_aceito || !bloco_c_aceito) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Todos os blocos precisam ser aceitos.' }) };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['client-ip']
    || 'desconhecido';
  const userAgent = event.headers['user-agent'] || '';

  try {
    // 1. Inserir em tcle_registros
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/tcle_registros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        escola_codigo,
        escola_id: escola_id || null,
        aluno_matricula,
        aluno_id: aluno_id || null,
        responsavel_nome,
        responsavel_cpf: responsavel_cpf_hash,
        ip_address: ip,
        user_agent: userAgent,
        timestamp_aceite: new Date().toISOString(),
        versao_documento: 'TCLE-ARIA-v1.0-junho2026',
        hash_documento,
        bloco_a_aceito,
        bloco_b_aceito,
        bloco_c_aceito,
        tcle_assinado: true,
        revogado: false,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: `Erro ao registrar TCLE: ${err}` }) };
    }

    // 2. Atualizar alunos.tcle_assinado = true
    await fetch(`${supabaseUrl}/rest/v1/alunos?matricula=eq.${encodeURIComponent(aluno_matricula)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ tcle_assinado: true }),
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
