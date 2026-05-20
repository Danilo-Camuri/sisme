import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/FormElements'

export default function Home() {
  const { aluno, logout } = useAuth()

  return (
    <div style={{
      minHeight: '100dvh',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px', height: '64px',
        background: 'var(--accent-primary)',
        borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 4 5 4 10.5C4 14 6.5 17 10 17C13.5 17 16 14 16 10.5C16 5 10 2 10 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="10" cy="10.5" r="2.5" fill="var(--accent-primary)"/>
        </svg>
      </div>

      <div>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          Olá, {aluno?.nome?.split(' ')[0] ?? 'por aí'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Autenticação funcionando. Próximo passo: onboarding.
        </p>
      </div>

      {aluno && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 24px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          textAlign: 'left'
        }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>Escola:</strong> {aluno.escolas?.nome}</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>Matrícula:</strong> {aluno.matricula}</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>Personagem:</strong> {aluno.personagem ?? 'não escolhido ainda'}</span>
        </div>
      )}

      <Button variant="ghost" onClick={logout}>
        Sair da conta
      </Button>
    </div>
  )
}
