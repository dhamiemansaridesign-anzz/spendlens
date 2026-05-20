import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function getInitialTheme() {
  try { return localStorage.getItem('spendlens_theme') || 'light' } catch { return 'light' }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('spendlens_theme', theme) } catch {}
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
