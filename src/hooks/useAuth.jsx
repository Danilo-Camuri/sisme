import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [aluno, setAluno] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchAluno(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchAluno(session.user.id)
      else {
        setAluno(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchAluno(userId) {
    const { data } = await supabase
      .from('alunos')
      .select('*, escolas(nome, codigo)')
      .eq('usuario_id', userId)
      .single()
    setAluno(data)
    setLoading(false)
  }

  // Chamada no step 0 do cadastro — valida escola e matrícula antes de avançar
  async function validarEscolaMatricula({ codigoEscola, matricula }) {
    // Busca escola pelo código
    const { data: escola, error: errEscola } = await supabase
      .from('escolas')
      .select('id, nome')
      .eq('codigo', codigoEscola.toUpperCase().trim())
      .eq('ativo', true)
      .maybeSingle()

    if (errEscola) {
      console.error('Erro ao buscar escola:', errEscola)
      return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' }
    }

    if (!escola) {
      return { error: 'Código de escola inválido. Verifique com sua escola.' }
    }

    // Busca matrícula nessa escola
    const { data: alunoExistente, error: errAluno } = await supabase
      .from('alunos')
      .select('id, usuario_id')
      .eq('matricula', matricula.trim())
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (errAluno) {
      console.error('Erro ao buscar matrícula:', errAluno)
      return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' }
    }

    if (!alunoExistente) {
      return { error: 'Matrícula não encontrada. Verifique o número ou fale com sua escola.' }
    }

    if (alunoExistente.usuario_id) {
      return { error: 'Esta matrícula já possui uma conta cadastrada.' }
    }

    return { success: true, escolaId: escola.id, alunoId: alunoExistente.id }
  }

  // Chamada no step final — cria a conta e vincula à matrícula
  async function cadastrar({ email, senha, nome, escolaId, alunoId }) {
    // Cria conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        data: { nome }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { error: 'Este e-mail já está cadastrado.' }
      }
      return { error: 'Erro ao criar conta. Tente novamente.' }
    }

    // Vincula o usuário à matrícula
    const { error: updateError } = await supabase
      .from('alunos')
      .update({
        usuario_id: authData.user.id,
        nome: nome.trim()
      })
      .eq('id', alunoId)

    if (updateError) {
      console.error('Erro ao vincular matrícula:', updateError)
      return { error: 'Erro ao vincular conta. Tente novamente.' }
    }

    return { success: true, confirmacaoEmail: !authData.session }
  }

  async function login({ email, senha }) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'E-mail ou senha incorretos.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.' }
      }
      return { error: 'Erro ao entrar. Tente novamente.' }
    }

    return { success: true }
  }

  async function recuperarSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nova-senha` }
    )

    if (error) return { error: 'Não foi possível enviar o e-mail. Verifique o endereço.' }
    return { success: true }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, aluno, loading, validarEscolaMatricula, cadastrar, login, recuperarSenha, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
