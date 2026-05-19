import React, { createContext, useContext, useEffect, useState } from 'react'
import { getAuthUser, setAuthUser, clearAuthUser, getAccessToken, setAccessToken, clearAccessToken } from '../store/auth'
import { getExpenses, addExpense, deleteExpense } from '../store/expenses'
import { appendExpense, ensureSheetHeaders } from '../services/sheets'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [accessToken, setAccessTokenState] = useState(null)

  useEffect(() => {
    Promise.all([getAuthUser(), getAccessToken()]).then(([u, token]) => {
      setUser(u || null)
      setAccessTokenState(token || null)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) getExpenses().then(setExpenses)
  }, [user])

  async function login(userData, token, expiresIn) {
    await setAuthUser(userData)
    setUser(userData)
    if (token) {
      await setAccessToken(token, expiresIn)
      setAccessTokenState(token)
      await ensureSheetHeaders(token).catch(() => {})
    }
    const exps = await getExpenses()
    setExpenses(exps)
  }

  async function connectSheets(token, expiresIn) {
    await setAccessToken(token, expiresIn)
    setAccessTokenState(token)
    await ensureSheetHeaders(token).catch(() => {})
  }

  async function logout() {
    await clearAuthUser()
    await clearAccessToken()
    setUser(null)
    setAccessTokenState(null)
    setExpenses([])
  }

  async function saveExpense(expense) {
    const saved = await addExpense(expense)
    setExpenses((prev) => [saved, ...prev])

    if (!accessToken) return { expense: saved, synced: false }

    try {
      await appendExpense(accessToken, saved)
      return { expense: saved, synced: true }
    } catch (err) {
      console.error('[SpendLens] Sheets sync failed:', err.message)
      return { expense: saved, synced: false, syncError: err.message }
    }
  }

  async function removeExpense(id) {
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const sheetsConnected = !!accessToken

  return (
    <AppContext.Provider value={{
      user, authLoading, login, logout,
      expenses, saveExpense, removeExpense,
      sheetsConnected, connectSheets,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
