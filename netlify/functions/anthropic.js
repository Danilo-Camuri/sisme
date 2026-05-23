// netlify/functions/anthropic.js
// Proxy seguro para a Anthropic API — resolve CORS e protege a API key.
//
// ARQUITETURA:
// O system prompt completo da ARIA (com histórico injetado) é montado
// no frontend (AriaChat.jsx + systemPrompts.js) e enviado no body desta chamada.
// Esta função apenas repassa o body para a Anthropic, adicionando a API key
// que fica segura no servidor (variável de ambiente ANTHROPIC_API_KEY no Netlify).
//
// O que esta função FAZ:
//   - Aceita POST com body JSON contendo { model, max_tokens, system, messages }
//   - Adiciona x-api-key e anthropic-version nos headers
//   - Repassa para https://api.anthropic.com/v1/messages
//   - Devolve a resposta com header CORS liberado
//
// O que esta função NÃO FAZ (e não deve fazer):
//   - Não armazena nenhuma mensagem
//   - Não acessa o Supabase
//   - Não modifica o body recebido
//   - Não tem lógica de negócio

exports.handler = async function (event) {
  // Só aceita POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API key não configurada no servidor.' }),
    }
  }

  try {
    const body = JSON.parse(event.body)

    // Validação mínima
    if (!body.messages || !Array.isArray(body.messages)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Campo messages ausente ou inválido.' }),
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
