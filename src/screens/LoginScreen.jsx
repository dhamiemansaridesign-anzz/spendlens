import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useApp } from '../context/AppContext'

export default function LoginScreen() {
  const { login } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startLogin = useGoogleLogin({
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    onSuccess: async (tokenResponse) => {
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const profile = await profileRes.json()
        await login(
          { id: profile.sub, name: profile.name, email: profile.email, picture: profile.picture },
          tokenResponse.access_token,
          tokenResponse.expires_in ?? 3600,
        )
      } catch {
        setError('Sign-in failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Sign-in was cancelled or failed.')
      setLoading(false)
    },
  })

  function handleSignIn() {
    setError('')
    setLoading(true)
    startLogin()
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh bg-canvas px-6 py-12">
      <div className="w-full" />

      <div className="flex flex-col items-center gap-10 w-full max-w-xs">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-ink flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5" />
              <path d="M16 8v8l5 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">SpendLens</h1>
            <p className="text-sm text-muted mt-1">Track every rupee, effortlessly</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['₹ Quick entry', 'Google Sheets sync', 'Spend insights'].map((f) => (
            <span key={f} className="px-3 py-1 rounded-pill bg-canvas-soft text-xs font-medium text-body">
              {f}
            </span>
          ))}
        </div>

        {/* Sign in */}
        <div className="w-full flex flex-col gap-3 items-center">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-pill bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-opacity active:bg-primary-active"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <p className="text-xs text-semantic-down text-center">{error}</p>}

          <p className="text-xs text-muted text-center leading-relaxed">
            SpendLens will sync your expenses to<br />your Google Sheet automatically.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-soft">Made for India · v0.1</p>
    </div>
  )
}
