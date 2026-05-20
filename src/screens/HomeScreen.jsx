import React from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import QuickAdd from '../components/QuickAdd'
import PullToRefresh from '../components/PullToRefresh'

const CATEGORY_META = {
  food:          { emoji: '🍛', color: '#fff3cd' },
  transport:     { emoji: '🚗', color: '#dbeafe' },
  shopping:      { emoji: '🛍️', color: '#fce7f3' },
  health:        { emoji: '💊', color: '#dcfce7' },
  entertainment: { emoji: '🎬', color: '#ede9fe' },
  utilities:     { emoji: '⚡', color: '#ffedd5' },
  other:         { emoji: '📦', color: '#f1f5f9' },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayTotal(expenses) {
  const today = new Date().toDateString()
  return expenses.filter((e) => new Date(e.createdAt).toDateString() === today)
    .reduce((s, e) => s + Number(e.amount), 0)
}

function monthTotal(expenses) {
  const now = new Date()
  return expenses.filter((e) => {
    const d = new Date(e.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + Number(e.amount), 0)
}

function dateLabel(dateString) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (dateString === today) return 'Today'
  if (dateString === yesterday) return 'Yesterday'
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupByDate(expenses) {
  const groups = {}
  for (const e of expenses) {
    const key = new Date(e.createdAt).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function HomeScreen({ onViewHistory }) {
  const { user, expenses, removeExpense, refreshExpenses } = useApp()
  const { isDark, toggleTheme } = useTheme()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const recent = expenses.slice(0, 10)
  const groups = groupByDate(recent)
  const dateKeys = Object.keys(groups)

  return (
    <PullToRefresh onRefresh={refreshExpenses}>
    <div className="flex flex-col gap-4 px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{greeting()},</p>
          <h2 className="text-xl font-semibold text-ink">{firstName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-canvas-softer flex items-center justify-center transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              /* Sun — switch to light */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon — switch to dark */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
          {user?.picture && (
            <img src={user.picture} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 24, padding: 16, boxShadow: 'var(--shadow-card)', transition: 'background-color 0.2s ease' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Today</p>
          <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
            ₹{todayTotal(expenses).toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ backgroundColor: 'var(--color-canvas-soft)', borderRadius: 24, padding: 16, transition: 'background-color 0.2s ease' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>This month</p>
          <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
            ₹{monthTotal(expenses).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Quick Add */}
      <QuickAdd />

      {/* Recent transactions */}
      {expenses.length === 0 ? (
        <div className="rounded-card bg-canvas-soft p-6 text-center">
          <p className="text-2xl mb-2">💸</p>
          <p className="text-sm text-muted">No expenses yet. Add your first one above!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                  {dateLabel(dateKey)}
                </p>
                <p className="text-xs text-muted font-money">
                  ₹{groups[dateKey].reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {groups[dateKey].map((e) => {
                  const meta = CATEGORY_META[e.category] || CATEGORY_META.other
                  const emoji = e.categoryEmoji || meta.emoji
                  const label = e.categoryLabel || e.category
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-card bg-canvas border border-hairline px-4 py-3"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <div
                        className="cat-icon w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink capitalize truncate">
                          {e.note || label}
                        </p>
                        <p className="text-xs text-muted">
                          {e.paymentMethod} · {formatTime(e.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-ink font-money">
                          ₹{Number(e.amount).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => removeExpense(e.id)}
                          className="text-[10px] text-muted-soft active:text-muted transition-colors"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={onViewHistory}
            className="w-full py-3 rounded-pill bg-canvas-soft text-sm font-semibold text-ink flex items-center justify-center gap-2"
          >
            View full history
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
    </PullToRefresh>
  )
}
