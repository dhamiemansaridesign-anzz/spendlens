import React, { useState, useEffect, useRef } from 'react'

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if user previously dismissed
    try { if (localStorage.getItem('pwa_dismissed')) return } catch {}

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Android/Chrome: capture the browser's install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show banner after 3 seconds if installable
    const timer = setTimeout(() => {
      if (deferredPromptRef.current || ios) setVisible(true)
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      clearTimeout(timer)
    }
  }, [])

  function handleInstall() {
    const prompt = deferredPromptRef.current
    if (!prompt) return
    prompt.prompt()
    prompt.userChoice.finally(() => {
      deferredPromptRef.current = null
      setVisible(false)
    })
  }

  function handleDismiss() {
    setVisible(false)
    try { localStorage.setItem('pwa_dismissed', '1') } catch {}
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 76,
        left: 12,
        right: 12,
        zIndex: 300,
        backgroundColor: 'var(--color-canvas)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 20,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      {/* App icon */}
      <div
        style={{
          width: 42, height: 42, borderRadius: 10,
          backgroundColor: '#0052ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>SL</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'Inter, sans-serif' }}>
          Install SpendLens
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
          {isIOS
            ? 'Tap \u{1F4E4} Share → Add to Home Screen'
            : 'Add to home screen for quick access'}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={handleDismiss}
          style={{
            padding: '5px 10px', borderRadius: 100,
            border: '1px solid var(--color-hairline)',
            background: 'none', color: 'var(--color-muted)',
            fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}
        >
          Later
        </button>
        {!isIOS && (
          <button
            onClick={handleInstall}
            style={{
              padding: '5px 14px', borderRadius: 100,
              border: 'none', backgroundColor: '#0052ff', color: '#fff',
              fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}
          >
            Install
          </button>
        )}
      </div>
    </div>
  )
}
