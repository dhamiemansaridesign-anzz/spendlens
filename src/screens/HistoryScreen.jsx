import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

const CATEGORY_META = {
  food:          { emoji: '🍛', color: '#fff3cd' },
  transport:     { emoji: '🚗', color: '#dbeafe' },
  shopping:      { emoji: '🛍️', color: '#fce7f3' },
  health:        { emoji: '💊', color: '#dcfce7' },
  entertainment: { emoji: '🎬', color: '#ede9fe' },
  utilities:     { emoji: '⚡', color: '#ffedd5' },
  other:         { emoji: '📦', color: '#f1f5f9' },
}

function monthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (d.toDateString() === today) return 'Today'
  if (d.toDateString() === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupByMonthAndDay(expenses) {
  const months = {}
  for (const e of expenses) {
    const mk = monthKey(e.createdAt)
    if (!months[mk]) months[mk] = {}
    const dk = new Date(e.createdAt).toDateString()
    if (!months[mk][dk]) months[mk][dk] = []
    months[mk][dk].push(e)
  }
  return months
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function HistoryScreen({ onBack }) {
  const { expenses, removeExpense } = useApp()
  const [search, setSearch] = useState('')

  const filtered = search
    ? expenses.filter((e) =>
        (e.note || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.categoryLabel || e.category).toLowerCase().includes(search.toLowerCase()) ||
        e.paymentMethod.toLowerCase().includes(search.toLowerCase())
      )
    : expenses

  const monthGroups = groupByMonthAndDay(filtered)
  const monthKeys = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-ink">All Transactions</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-pill bg-canvas-softer text-sm text-ink placeholder-muted-soft border-none outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {monthKeys.length === 0 ? (
        <div className="rounded-card bg-canvas-soft p-8 text-center mt-4">
          <p className="text-3xl mb-3">{search ? '🔍' : '💸'}</p>
          <p className="text-sm text-muted">{search ? 'No results found.' : 'No transactions yet.'}</p>
        </div>
      ) : (
        monthKeys.map((mk) => {
          const days = monthGroups[mk]
          const dayKeys = Object.keys(days).sort((a, b) => new Date(b) - new Date(a))
          const total = Object.values(days).flat().reduce((s, e) => s + Number(e.amount), 0)

          return (
            <div key={mk}>
              <div className="flex items-center justify-between py-2 mb-1">
                <p className="text-sm font-semibold text-ink">{monthLabel(mk)}</p>
                <p className="text-sm font-semibold text-ink font-money">₹{total.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex flex-col gap-4">
                {dayKeys.map((dk) => {
                  const dayExp = days[dk]
                  const dayTotal = dayExp.reduce((s, e) => s + Number(e.amount), 0)
                  return (
                    <div key={dk}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                          {dayLabel(dayExp[0].createdAt)}
                        </p>
                        <p className="text-xs text-muted font-money">₹{dayTotal.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {dayExp.map((e) => {
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
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
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
                                  className="text-[10px] text-muted-soft active:text-semantic-down transition-colors"
                                >
                                  delete
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-px bg-hairline-soft mt-4" />
            </div>
          )
        })
      )}
    </div>
  )
}
