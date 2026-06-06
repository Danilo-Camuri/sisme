// App.jsx — v3
// Adiciona rotas legais: /privacidade, /termos, /protecao-a-vida, /lgpd

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useAutoTheme } from './hooks/useAutoTheme'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import { RecuperarSenha, NovaSenha } from './components/auth/Senha'
import Onboarding from './pages/onboarding/Onboarding'
import HomeAluno from './pages/aluno/HomeAluno'
import LandingPage from './pages/LandingPage'
import PoliticaPrivacidade from './pages/legal/PoliticaPrivacidade'
import TermosDeUso from './pages/legal/TermosDeUso'
import PoliticaCrises from './pages/legal/PoliticaCrises'
import ConformidadeLGPD from './pages/legal/ConformidadeLGPD'

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
        {/* Pública */}
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/cadastro"            element={<Onboarding />} />
        <Route path="/recuperar-senha"     element={<RecuperarSenha />} />
        <Route path="/nova-senha"          element={<NovaSenha />} />

        {/* Páginas legais — públicas */}
        <Route path="/privacidade"         element={<PoliticaPrivacidade />} />
        <Route path="/termos"              element={<TermosDeUso />} />
        <Route path="/protecao-a-vida"     element={<PoliticaCrises />} />
        <Route path="/lgpd"                element={<ConformidadeLGPD />} />   {/* sem link público na nav */}

        {/* Protegidas */}
        <Route path="/onboarding"          element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/home"                element={<ProtectedRoute><AlunoRoute><HomeAluno /></AlunoRoute></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*"                    element={<Navigate to="/" replace />} />
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
