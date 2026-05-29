import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const styles = {
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-2)',
    letterSpacing: '0.02em'
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px 16px',
    fontSize: '16px',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.2s',
    WebkitAppearance: 'none'
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '44px',
    minHeight: '44px',
    justifyContent: 'center'
  },
  fieldError: {
    fontSize: '12px',
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }
}

export function Input({ label, type = 'text', error, hint, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div style={styles.fieldWrap}>
      {label && <label style={styles.label}>{label}</label>}
      <div style={styles.inputWrap}>
        <input
          type={inputType}
          style={{
            ...styles.input,
            borderColor: error ? 'var(--error)' : undefined,
            paddingRight: isPassword ? '48px' : undefined
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'}
          autoCapitalize={type === 'email' || type === 'password' ? 'none' : undefined}
          autoCorrect="off"
          spellCheck={false}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            style={styles.eyeBtn}
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span style={styles.fieldError}>
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{hint}</span>
      )}
    </div>
  )
}

export function Button({ children, variant = 'primary', loading, fullWidth, ...props }) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: 'var(--radius-full)',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
    width: fullWidth ? '100%' : undefined,
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? 0.5 : 1,
    minHeight: '44px'
  }

  const variants = {
    primary: {
      background: 'var(--aria-action)',
      color: 'var(--aria-action-text)',
      border: 'none'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
      border: '1px solid var(--border)'
    },
    danger: {
      background: 'transparent',
      color: 'var(--error)',
      border: '1px solid var(--error)'
    }
  }

  return (
    <button
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => { if (!props.disabled && !loading) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!props.disabled && !loading) e.currentTarget.style.opacity = '1' }}
      onMouseDown={e => { if (!props.disabled && !loading) e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}

export function Alert({ type = 'error', children }) {
  const colors = {
    error:   { bg: 'var(--error-bg)',   border: 'var(--error)',   color: 'var(--error)' },
    success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)' },
    info:    { bg: 'var(--aria-action-subtle)', border: 'var(--aria-action)', color: 'var(--aria-action)' }
  }
  const c = colors[type] || colors.error

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '12px 14px',
      borderRadius: 'var(--radius-sm)',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      {type === 'error'   && <AlertCircle  size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
      {type === 'success' && <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
      {children}
    </div>
  )
}
