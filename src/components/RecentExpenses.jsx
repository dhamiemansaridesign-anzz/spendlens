import React from 'react'
import { useApp } from '../context/AppContext'

const CATEGORY_META = {
  food: { emoji: '🍛', color: '#fff3cd' },
  transport: { emoji: '🚗', color: '#dbeafe' },
  shopping: { emoji: '🛍️', color: '#fce7f3' },
  health: { emoji: '💊', color: '#dcfce7' },
  entertainment: { emoji: '🎬', color: '#ede9fe' },
  utilities: { emoji: '⚡', color: '#ffedd5' },
  other: { emoji: '📦', color: '#f1f5f9' },
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function RecentExpenses() {
  const { expenses, removeExpense } = useApp()

  if (!expenses.length) {
    return (
      <div className="rounded-card bg-canvas-soft p-6 text-center">
        <p className="text-2xl mb-2">💸</p>
        <p className="text-sm text-[#6b6b6b]">No expenses yet. Add your first one above!</p>
      </div>
    )
  }

  const recent = expenses.slice(0, 10)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-base text-ink">Recent</h3>
      <div className="flex flex-col gap-2">
        {recent.map((e) => {
          const meta = CATEGORY_META[e.category] || CATEGORY_META.other
          const emoji = e.categoryEmoji || meta.emoji
          const label = e.categoryLabel || e.category
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-card bg-canvas border border-[#f0f0f0] px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink capitalize truncate">
                  {e.note || label}
                </p>
                <p className="text-xs text-[#999]">
                  {e.paymentMethod} · {formatDate(e.createdAt)} {formatTime(e.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-ink">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                <button
                  onClick={() => removeExpense(e.id)}
                  className="text-[10px] text-[#ccc] hover:text-[#999] transition-colors"
                >
                  remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
