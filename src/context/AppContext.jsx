import React, { createContext, useContext, useEffect, useState } from 'react'
import { getAuthUser, setAuthUser, clearAuthUser, getAccessToken, setAccessToken, clearAccessToken } from '../store/auth'
import { getExpenses, addExpense, deleteExpense } from '../store/expenses'
import { getUserSheetId, setUserSheetId } from '../store/sheets'
import { createUserSheet, ensureSheetHeaders, appendExpense } from '../services/sheets'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [accessToken, setAccessTokenState] = useState(null)
  const [sheetId, setSheetId] = useState(null)

  // On boot: restore user, token, and sheet ID from storage
  useEffect(() => {
    Promise.all([getAuthUser(), getAccessToken()]).then(async ([u, token]) => {
      setUser(u || null)
      setAccessTokenState(token || null)
      if (u) {
        const sid = await getUserSheetId(u.id)
        setSheetId(sid || null)
      }
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) getExpenses().then(setExpenses)
  }, [user])

  // Get existing sheet ID for this user, or create a new one in their Drive
  async function resolveSheet(token, userId) {
    let sid = await getUserSheetId(userId)
    if (!sid) {
      console.log('[SpendLens] Creating new Google Sheet for user…')
      sid = await createUserSheet(token, 'SpendLens - My Expenses')
      await setUserSheetId(userId, sid)
      await ensureSheetHeaders(token, sid).catch(() => {})
      console.log('[SpendLens] Sheet created:', sid)
    }
    return sid
  }

  async function login(userData, token, expiresIn) {
    await setAuthUser(userData)
    setUser(userData)

    if (token) {
      await setAccessToken(token, expiresIn)
      setAccessTokenState(token)
      try {
        const sid = await resolveSheet(token, userData.id)
        setSheetId(sid)
      } catch (err) {
        console.error('[SpendLens] Sheet setup failed:', err.message)
      }
    }

    const exps = await getExpenses()
    setExpenses(exps)
  }

  async function connectSheets(token, expiresIn) {
    await setAccessToken(token, expiresIn)
    setAccessTokenState(token)
    if (user) {
      try {
        const sid = await resolveSheet(token, user.id)
        setSheetId(sid)
      } catch (err) {
        console.error('[SpendLens] Sheet setup failed:', err.message)
      }
    }
  }

  async function logout() {
    await clearAuthUser()
    await clearAccessToken()
    setUser(null)
    setAccessTokenState(null)
    setSheetId(null)
    setExpenses([])
    // Note: sheet ID is intentionally kept in idb so it's reused on next login
  }

  async function saveExpense(expense) {
    const saved = await addExpense(expense)
    setExpenses((prev) => [saved, ...prev])

    if (!accessToken || !sheetId) return { expense: saved, synced: false }

    try {
      await appendExpense(accessToken, sheetId, saved)
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

  const sheetsConnected = !!(accessToken && sheetId)

  return (
    <AppContext.Provider value={{
      user, authLoading, login, logout,
      expenses, saveExpense, removeExpense,
      sheetsConnected, connectSheets, sheetId,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
