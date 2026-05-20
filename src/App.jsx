import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import Cadastro from './components/auth/Cadastro'
import { RecuperarSenha, NovaSenha } from './components/auth/Senha'
import Onboarding from './pages/onboarding/Onboarding'
import Home from './pages/Home'

// Rota protegida que também redireciona para onboarding se necessário
function AlunoRoute({ children }) {
  const { aluno, loading } = useAuth()

  if (loading) return null

  if (aluno && !aluno.onboarding_ok) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/nova-senha" element={<NovaSenha />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AlunoRoute>
                  <Home />
                </AlunoRoute>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
