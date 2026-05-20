import React, { useState, useRef, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useApp } from '../context/AppContext'
import { getCustomCategories, addCustomCategory } from '../store/categories'

const DEFAULT_CATEGORIES = [
  { id: 'food',          label: 'Food',      emoji: '🍛' },
  { id: 'transport',     label: 'Transport', emoji: '🚗' },
  { id: 'shopping',      label: 'Shopping',  emoji: '🛍️' },
  { id: 'health',        label: 'Health',    emoji: '💊' },
  { id: 'entertainment', label: 'Fun',       emoji: '🎬' },
  { id: 'utilities',     label: 'Bills',     emoji: '⚡' },
  { id: 'other',         label: 'Other',     emoji: '📦' },
]

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card']

const EMOJI_RE = /^(\p{Emoji_Presentation}(?:\p{Emoji_Modifier}|️|⃣|(?:‍\p{Emoji_Presentation})+)*)\s*/u

function parseInput(raw) {
  const trimmed = raw.trim()
  const match = trimmed.match(EMOJI_RE)
  if (match) {
    const emoji = match[1]
    const label = trimmed.slice(match[0].length).trim()
    return { emoji, label: label || emoji }
  }
  return { emoji: '🏷️', label: trimmed }
}

// Design tokens — static values for theme-invariant colors, CSS variables for theme-sensitive ones
const T = {
  blue:       '#0052ff',
  blueActive: '#003ecc',
  ink:        'var(--color-ink)',
  surfaceSoft:'var(--color-canvas-softer)',
  hairline:   'var(--color-hairline)',
  muted:      'var(--color-muted)',
  mutedSoft:  'var(--color-muted-soft)',
  green:      '#05b169',
  amber:      '#f59e0b',
  mono:       "'JetBrains Mono', monospace",
}

export default function QuickAdd() {
  const { saveExpense, sheetsConnected, connectSheets } = useApp()
  const [customCats, setCustomCats] = useState([])
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [phase, setPhase] = useState(null)
  const [syncState, setSyncState] = useState(null)
  const [showInput, setShowInput] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const newCatInputRef = useRef(null)
  const pendingRef = useRef(null)

  useEffect(() => { getCustomCategories().then(setCustomCats) }, [])
  useEffect(() => { if (showInput) newCatInputRef.current?.focus() }, [showInput])

  const allCategories = [...DEFAULT_CATEGORIES, ...customCats]
  const selectedCat = allCategories.find((c) => c.id === category) || DEFAULT_CATEGORIES[0]

  async function handleAddCategory() {
    const name = newCatName.trim()
    if (!name) return
    setAddingCat(true)
    const { emoji, label } = parseInput(name)
    const newCat = await addCustomCategory({ emoji, label })
    setCustomCats((prev) => [...prev, newCat])
    setCategory(newCat.id)
    setNewCatName('')
    setShowInput(false)
    setAddingCat(false)
  }

  async function finishSave(expense) {
    setPhase('saving')
    const result = await saveExpense(expense)
    setPhase(null)
    setAmount('')
    setNote('')
    setSyncState(result.synced ? 'synced' : result.syncError ? 'failed' : 'saved')
    setTimeout(() => setSyncState(null), 2500)
  }

  const requestSheetsAccess = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (tokenResponse) => {
      await connectSheets(tokenResponse.access_token, tokenResponse.expires_in ?? 3600)
      const expense = pendingRef.current
      pendingRef.current = null
      if (expense) await finishSave(expense)
    },
    onError: async () => {
      const expense = pendingRef.current
      pendingRef.current = null
      if (expense) await finishSave(expense)
    },
  })

  async function handleSave() {
    const num = parseFloat(amount)
    if (!num || num <= 0) return
    const expense = {
      category: selectedCat.id,
      categoryLabel: selectedCat.label,
      categoryEmoji: selectedCat.emoji,
      amount: num,
      note,
      paymentMethod,
    }
    setSyncState(null)
    if (!sheetsConnected) {
      setPhase('connecting')
      pendingRef.current = expense
      requestSheetsAccess()
      return
    }
    await finishSave(expense)
  }

  const busy = phase !== null

  const saveBg = syncState === 'synced' || syncState === 'saved' ? T.green
    : syncState === 'failed' ? T.amber
    : T.blue

  const saveLabel = phase === 'connecting' ? 'Connecting to Sheets…'
    : phase === 'saving'        ? 'Saving…'
    : syncState === 'synced'    ? '✓ Saved · Synced to Sheets'
    : syncState === 'failed'    ? '✓ Saved · Sync failed'
    : syncState === 'saved'     ? '✓ Saved'
    : 'Save Expense'

  return (
    <div style={{ backgroundColor: 'var(--color-canvas)', border: `1px solid ${T.hairline}`, borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-card)' }}>
      <p style={{ fontWeight: 600, fontSize: 15, color: T.ink, margin: 0 }}>Quick Add</p>

      {/* ── Category chips ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {allCategories.map(({ id, label, emoji }) => {
            const active = category === id
            return (
              <button
                key={id}
                onClick={() => { setCategory(id); setShowInput(false) }}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 100,
                  border: active ? `2px solid ${T.blue}` : '2px solid transparent',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--color-primary-tint)' : T.surfaceSoft,
                  color: active ? T.blue : T.ink,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background-color 0.15s, color 0.15s',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, background: 'none' }}>{emoji}</span>
                <span>{label}</span>
              </button>
            )
          })}

          {/* + Add chip */}
          <button
            onClick={() => setShowInput((v) => !v)}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 100,
              cursor: 'pointer',
              backgroundColor: showInput ? T.surfaceSoft : 'transparent',
              color: T.muted,
              fontSize: 14,
              fontWeight: 500,
              border: `1px dashed ${T.hairline}`,
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{showInput ? '×' : '+'}</span>
            <span>{showInput ? 'Close' : 'Add'}</span>
          </button>
        </div>

        {showInput && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={newCatInputRef}
              type="text"
              placeholder="e.g. Gym or 🏋️ Gym"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory()
                if (e.key === 'Escape') { setShowInput(false); setNewCatName('') }
              }}
              maxLength={30}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.hairline}`, backgroundColor: T.surfaceSoft, fontSize: 14, color: T.ink, outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.2s, border-color 0.2s' }}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim() || addingCat}
              style={{ padding: '10px 16px', borderRadius: 100, border: 'none', backgroundColor: T.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!newCatName.trim() || addingCat) ? 0.35 : 1 }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* ── Amount input ── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 14, fontSize: 20, fontWeight: 600, color: T.ink, fontFamily: T.mono, userSelect: 'none' }}>₹</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, border: `1px solid ${T.hairline}`, backgroundColor: T.surfaceSoft, fontSize: 24, fontWeight: 600, color: T.ink, fontFamily: T.mono, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
          onFocus={(e) => { e.target.style.borderColor = T.blue }}
          onBlur={(e) => { e.target.style.borderColor = T.hairline }}
        />
      </div>

      {/* ── Note ── */}
      <input
        type="text"
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={80}
        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.hairline}`, backgroundColor: T.surfaceSoft, fontSize: 14, color: T.ink, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
        onFocus={(e) => { e.target.style.borderColor = T.blue }}
        onBlur={(e) => { e.target.style.borderColor = T.hairline }}
      />

      {/* ── Payment method ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PAYMENT_METHODS.map((m) => {
          const active = paymentMethod === m
          return (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 100, border: 'none', cursor: 'pointer', backgroundColor: active ? T.blue : T.surfaceSoft, color: active ? '#ffffff' : T.ink, fontSize: 12, fontWeight: 600, transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* ── Save button ── */}
      {/* No `disabled` attribute — browser UA overrides inline opacity/color on disabled buttons */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 100,
          border: 'none',
          outline: 'none',
          WebkitAppearance: 'none',
          cursor: busy ? 'wait' : 'pointer',
          backgroundColor: saveBg,
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          opacity: 1,
          transition: 'background-color 0.15s',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {saveLabel}
      </button>
    </div>
  )
}
