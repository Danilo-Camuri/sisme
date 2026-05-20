// Edge Function: validar-matricula
// Deploy: supabase functions deploy validar-matricula
//
// Esta função valida a matrícula SERVER-SIDE usando service_role,
// contornando o RLS para fazer a verificação segura durante o cadastro.
// O frontend chama esta função ANTES de criar a conta no Auth.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { codigoEscola, matricula } = await req.json()

    if (!codigoEscola || !matricula) {
      return new Response(
        JSON.stringify({ valido: false, erro: 'Dados incompletos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Service role bypassa RLS — seguro porque está no servidor
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { data: escola } = await supabase
      .from('escolas')
      .select('id')
      .eq('codigo', codigoEscola.toUpperCase().trim())
      .eq('ativo', true)
      .single()

    if (!escola) {
      return new Response(
        JSON.stringify({ valido: false, erro: 'Código de escola inválido.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: aluno } = await supabase
      .from('alunos')
      .select('id, usuario_id')
      .eq('matricula', matricula.trim())
      .eq('escola_id', escola.id)
      .single()

    if (!aluno) {
      return new Response(
        JSON.stringify({ valido: false, erro: 'Matrícula não encontrada.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (aluno.usuario_id) {
      return new Response(
        JSON.stringify({ valido: false, erro: 'Esta matrícula já possui uma conta.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ valido: true, alunoId: aluno.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ valido: false, erro: 'Erro interno. Tente novamente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
