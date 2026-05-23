import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useAutoTheme } from './hooks/useAutoTheme'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import { RecuperarSenha, NovaSenha } from './components/auth/Senha'
import Onboarding from './pages/onboarding/Onboarding'
import AriaChat from './pages/aluno/AriaChat'

function AlunoRoute({ children }) {
  const { aluno, loading } = useAuth()
  if (loading) return null
  if (aluno && !aluno.onboarding_ok) return <Navigate to="/onboarding" replace />
  return children
}

function AppWithTheme() {
  useAutoTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/cadastro"        element={<Onboarding />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/nova-senha"      element={<NovaSenha />} />
        <Route
          path="/onboarding"
          element={<ProtectedRoute><Onboarding /></ProtectedRoute>}
        />
        <Route
          path="/home"
          element={<ProtectedRoute><AlunoRoute><AriaChat /></AlunoRoute></ProtectedRoute>}
        />
        <Route path="/"  element={<Navigate to="/home"  replace />} />
        <Route path="*"  element={<Navigate to="/home"  replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithTheme />
    </AuthProvider>
  )
}
