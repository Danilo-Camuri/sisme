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

  async function cadastrar({ email, senha, codigoEscola, matricula, nome }) {
    // 1. Valida se a matrícula existe e está disponível nessa escola
    const { data: escola } = await supabase
      .from('escolas')
      .select('id')
      .eq('codigo', codigoEscola.toUpperCase().trim())
      .single()

    if (!escola) {
      return { error: 'Código de escola inválido. Verifique com sua escola.' }
    }

    const { data: alunoExistente } = await supabase
      .from('alunos')
      .select('id, usuario_id')
      .eq('matricula', matricula.trim())
      .eq('escola_id', escola.id)
      .single()

    if (!alunoExistente) {
      return { error: 'Matrícula não encontrada. Verifique o número ou fale com sua escola.' }
    }

    if (alunoExistente.usuario_id) {
      return { error: 'Esta matrícula já possui uma conta cadastrada.' }
    }

    // 2. Cria conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        data: { nome, escola_id: escola.id, matricula }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { error: 'Este e-mail já está cadastrado.' }
      }
      return { error: 'Erro ao criar conta. Tente novamente.' }
    }

    // 3. Vincula o usuário à matrícula
    const { error: updateError } = await supabase
      .from('alunos')
      .update({
        usuario_id: authData.user.id,
        nome: nome.trim()
      })
      .eq('id', alunoExistente.id)

    if (updateError) {
      // Rollback: remove o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
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
    <AuthContext.Provider value={{ user, aluno, loading, cadastrar, login, recuperarSenha, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
