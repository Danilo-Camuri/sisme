exports.handler = função assíncrona (evento) {
  // Só. POSTAGEM
  se (evento.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  se (!apiKey) {
    retornar {
      Código de status: 500,
      body: JSON.stringify({ erro: 'API key não configurada no servidor' }),
    }
  }

  tentar {
    const body = JSON.parse(event.body)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      método: 'POST',
      cabeçalhos: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'versão antrópica': '2023-06-01',
      },
      corpo: JSON.stringify(corpo),
    })

    const data = await response.json()

    retornar {
      statusCode: response.status,
      cabeçalhos: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      corpo: JSON.stringify(dados),
    }
  } catch (erro) {
    retornar {
      Código de status: 500,
      corpo: JSON.stringify({ erro: err.message }),
    }
  }
}
