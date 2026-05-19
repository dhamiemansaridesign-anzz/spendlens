import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useApp } from '../context/AppContext'

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID}/edit`

function SettingsRow({ label, value, onClick, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 rounded-card bg-canvas border border-hairline transition-colors active:bg-canvas-soft ${destructive ? 'text-semantic-down' : 'text-ink'}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <span className="text-sm text-muted">{value}</span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

export default function SettingsScreen() {
  const { user, logout, sheetsConnected, connectSheets } = useApp()
  const [reconnecting, setReconnecting] = useState(false)

  const connectLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      try {
        await connectSheets(tokenResponse.access_token, tokenResponse.expires_in ?? 3600)
      } catch (err) {
        console.error('[SpendLens] connectSheets failed:', err.message)
      } finally {
        setReconnecting(false)
      }
    },
    onError: (err) => {
      console.error('[SpendLens] OAuth error:', err)
      setReconnecting(false)
    },
  })

  function handleConnect() {
    setReconnecting(true)
    connectLogin()
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <h2 className="text-xl font-semibold text-ink">Settings</h2>

      {/* Profile */}
      <div className="rounded-card bg-canvas border border-hairline p-4 flex items-center gap-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        {user?.picture ? (
          <img src={user.picture} alt="avatar" className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-canvas-soft flex items-center justify-center text-2xl">👤</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink truncate">{user?.name}</p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {/* Google Sheets */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Google Sheets Sync</p>

        <div className="rounded-card bg-canvas border border-hairline p-4 flex flex-col gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sheetsConnected ? 'bg-semantic-up' : 'bg-hairline'}`} />
            <div>
              <p className="text-sm font-medium text-ink">
                {sheetsConnected ? 'Connected' : 'Not connected'}
              </p>
              <p className="text-xs text-muted">
                {sheetsConnected ? 'Every save syncs automatically' : 'Will connect automatically on your next save'}
              </p>
            </div>
          </div>

          {!sheetsConnected && (
            <button
              onClick={handleConnect}
              disabled={reconnecting}
              className="w-full py-3 rounded-pill bg-canvas-softer text-ink text-sm font-semibold disabled:opacity-50"
            >
              {reconnecting ? 'Connecting…' : 'Reconnect now'}
            </button>
          )}
        </div>

        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-4 py-4 rounded-card bg-canvas border border-hairline text-ink active:bg-canvas-soft"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <span className="text-sm font-medium">Open Spreadsheet</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* Preferences */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">Preferences</p>
        <SettingsRow label="Default Payment Method" value="UPI" onClick={() => {}} />
        <SettingsRow label="Monthly Budget" value="Not set" onClick={() => {}} />
        <SettingsRow label="Currency" value="INR (₹)" onClick={() => {}} />
      </div>

      {/* About */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">About</p>
        <SettingsRow label="Version" value="0.1.0" onClick={() => {}} />
        <SettingsRow label="Made with ♥ in India" onClick={() => {}} />
      </div>

      <SettingsRow label="Sign Out" onClick={logout} destructive />
    </div>
  )
}
