import React, { useState, useEffect, useMemo } from 'react'
import { Doughnut, Line } from 'react-chartjs-2'
import { useApp } from '../context/AppContext'
import { getMonthlyBudget, setMonthlyBudget, clearMonthlyBudget } from '../store/budget'

const BUILTIN_LABELS = {
  food: 'Food', transport: 'Transport', shopping: 'Shopping',
  health: 'Health', entertainment: 'Entertainment', utilities: 'Bills', other: 'Other',
}

const CHART_SHADES = ['#0052ff', '#0a0b0d', '#3d3d3d', '#666', '#888', '#aaa', '#ccc']

function getCatLabel(catId, expArr) {
  const hit = expArr.find((e) => e.category === catId && e.categoryLabel)
  return hit?.categoryLabel || BUILTIN_LABELS[catId] || catId
}

function filterMonth(expenses, year, month) {
  return expenses.filter((e) => {
    const d = new Date(e.createdAt)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

function sumAmount(arr) {
  return arr.reduce((s, e) => s + Number(e.amount), 0)
}

function generateInsights({ thisExp, lastExp, totalThis, totalLast, budget, daysInMonth, daysPassed, catTotals, catLabels }) {
  const insights = []
  if (totalLast > 0) {
    const pct = Math.round(((totalThis - totalLast) / totalLast) * 100)
    if (pct > 10) insights.push(`You've spent ${pct}% more than last month overall.`)
    else if (pct < -10) insights.push(`You're spending ${Math.abs(pct)}% less than last month — great discipline!`)
  }
  const lastCatTotals = {}
  for (const e of lastExp) lastCatTotals[e.category] = (lastCatTotals[e.category] || 0) + Number(e.amount)
  const catChanges = Object.entries(catTotals)
    .map(([cat, total]) => {
      const last = lastCatTotals[cat] || 0
      if (!last) return null
      return { cat, pct: Math.round(((total - last) / last) * 100) }
    })
    .filter(Boolean).filter((c) => Math.abs(c.pct) >= 25)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
  for (const { cat, pct } of catChanges.slice(0, 2)) {
    const label = catLabels[cat]
    if (pct > 0) insights.push(`You spent ${pct}% more on ${label} this month vs last month.`)
    else insights.push(`You've cut ${label} spending by ${Math.abs(pct)}% vs last month.`)
  }
  if (budget && totalThis > 0 && daysPassed > 0) {
    const expected = (budget / daysInMonth) * daysPassed
    if (totalThis > budget) insights.push(`You've exceeded your ₹${budget.toLocaleString('en-IN')} monthly budget.`)
    else if (totalThis > expected * 1.2) insights.push(`Spending faster than planned — watch your budget!`)
    else if (totalThis <= expected * 0.85) insights.push(`You're on track to stay within your ₹${budget.toLocaleString('en-IN')} budget!`)
  }
  return insights.slice(0, 3)
}

export default function AnalysisScreen() {
  const { expenses } = useApp()
  const [budget, setBudget] = useState(null)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  useEffect(() => { getMonthlyBudget().then((b) => setBudget(b ?? null)) }, [])

  const now = new Date()
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisExp = filterMonth(expenses, now.getFullYear(), now.getMonth())
  const lastExp = filterMonth(expenses, lm.getFullYear(), lm.getMonth())
  const totalThis = sumAmount(thisExp)
  const totalLast = sumAmount(lastExp)
  const monthChangePct = totalLast > 0 ? Math.round(((totalThis - totalLast) / totalLast) * 100) : null

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const daysLeft = daysInMonth - daysPassed
  const dailyAvg = daysPassed > 0 ? Math.round(totalThis / daysPassed) : 0

  const catTotals = {}
  const catLabels = {}
  for (const e of thisExp) {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount)
    if (!catLabels[e.category]) catLabels[e.category] = getCatLabel(e.category, thisExp)
  }
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a)
  const biggestExp = [...thisExp].sort((a, b) => Number(b.amount) - Number(a.amount))[0]

  const budgetRemaining = budget != null ? budget - totalThis : null
  const dailyBudgetLeft = budgetRemaining != null && daysLeft > 0 ? Math.round(budgetRemaining / daysLeft) : null
  const budgetPct = budget ? Math.min(100, Math.round((totalThis / budget) * 100)) : 0

  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d })

  const insights = useMemo(
    () => generateInsights({ thisExp, lastExp, totalThis, totalLast, budget, daysInMonth, daysPassed, catTotals, catLabels }),
    [totalThis, totalLast, budget, JSON.stringify(catTotals)]
  )

  const donutData = {
    labels: sortedCats.map(([cat]) => catLabels[cat]),
    datasets: [{
      data: sortedCats.map(([, v]) => v),
      backgroundColor: sortedCats.map((_, i) => CHART_SHADES[i % CHART_SHADES.length]),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const lineData = {
    labels: last7.map((d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    datasets: [{
      data: last7.map((d) =>
        expenses.filter((e) => new Date(e.createdAt).toDateString() === d.toDateString())
          .reduce((s, e) => s + Number(e.amount), 0)
      ),
      borderColor: '#0052ff',
      backgroundColor: 'rgba(0,82,255,0.06)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#0052ff',
      pointBorderWidth: 0,
    }],
  }

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: '#7c828a' } },
      y: { grid: { color: '#eef0f3' }, ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: '#7c828a', callback: (v) => `₹${v >= 1000 ? `${v / 1000}k` : v}` } },
    },
  }

  async function handleSaveBudget() {
    const val = parseFloat(budgetInput)
    if (!val || val <= 0) return
    await setMonthlyBudget(val)
    setBudget(val)
    setEditingBudget(false)
  }

  async function handleClearBudget() {
    await clearMonthlyBudget()
    setBudget(null)
    setEditingBudget(false)
  }

  const Card = ({ children, className = '' }) => (
    <div className={`rounded-card bg-canvas border border-hairline p-4 ${className}`} style={{ boxShadow: 'var(--shadow-card)' }}>
      {children}
    </div>
  )

  const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">{title}</p>
      {children}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <div>
        <h2 className="text-xl font-semibold text-ink">Analysis</h2>
        <p className="text-sm text-muted">{now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Monthly total */}
      <Section title="This Month">
        <Card>
          <p className="text-3xl font-semibold text-ink font-money">₹{totalThis.toLocaleString('en-IN')}</p>
          {monthChangePct !== null ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-pill bg-canvas-softer overflow-hidden">
                <div className="h-full rounded-pill bg-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.abs(monthChangePct))}%` }} />
              </div>
              <p className={`text-xs font-semibold font-money ${monthChangePct > 0 ? 'text-semantic-down' : 'text-semantic-up'}`}>
                {monthChangePct > 0 ? '+' : ''}{monthChangePct}% vs last month
                <span className="text-muted font-normal ml-1">(₹{totalLast.toLocaleString('en-IN')})</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-soft mt-1">No data for last month</p>
          )}
        </Card>
      </Section>

      {/* Key metrics */}
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-muted mb-1">Daily average</p>
            <p className="text-xl font-semibold text-ink font-money">₹{dailyAvg.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-muted-soft mt-0.5">over {daysPassed} days</p>
          </Card>
          <Card>
            <p className="text-xs text-muted mb-1">Biggest expense</p>
            {biggestExp ? (
              <>
                <p className="text-xl font-semibold text-ink font-money">₹{Number(biggestExp.amount).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-muted-soft mt-0.5 truncate">{biggestExp.note || biggestExp.categoryLabel || biggestExp.category}</p>
              </>
            ) : (
              <p className="text-xl font-semibold text-muted-soft">—</p>
            )}
          </Card>
        </div>
      </Section>

      {/* Category breakdown */}
      {sortedCats.length > 0 && (
        <Section title="By Category">
          <Card className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40">
              <Doughnut
                data={donutData}
                options={{ cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString('en-IN')}` } } } }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] text-muted">Total</p>
                <p className="text-lg font-semibold font-money">₹{totalThis.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            {sortedCats.map(([cat, total], i) => {
              const pct = Math.round((total / totalThis) * 100)
              return (
                <Card key={cat} className="py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_SHADES[i % CHART_SHADES.length] }} />
                      <p className="text-sm font-medium text-ink">{catLabels[cat]}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink font-money">₹{total.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="h-1 rounded-pill bg-canvas-softer overflow-hidden">
                    <div className="h-full rounded-pill transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CHART_SHADES[i % CHART_SHADES.length] }} />
                  </div>
                  <p className="text-[10px] text-muted-soft mt-1">{pct}% of total</p>
                </Card>
              )
            })}
          </div>
        </Section>
      )}

      {/* 7-day trend */}
      <Section title="Last 7 Days">
        <Card><Line data={lineData} options={lineOptions} /></Card>
      </Section>

      {/* Budget planning */}
      <Section title="Budget Planning">
        <Card className="flex flex-col gap-3">
          {!editingBudget ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Monthly budget</p>
                  <p className="text-2xl font-semibold text-ink font-money">
                    {budget != null ? `₹${budget.toLocaleString('en-IN')}` : 'Not set'}
                  </p>
                </div>
                <button
                  onClick={() => { setBudgetInput(budget ? String(budget) : ''); setEditingBudget(true) }}
                  className="px-4 py-2 rounded-pill bg-canvas-softer text-xs font-semibold text-ink"
                >
                  {budget != null ? 'Edit' : 'Set budget'}
                </button>
              </div>

              {budget != null && (
                <>
                  <div className="h-2 rounded-pill bg-canvas-softer overflow-hidden">
                    <div
                      className={`h-full rounded-pill transition-all duration-500 ${budgetPct > 100 ? 'bg-semantic-down' : budgetPct > 80 ? 'bg-[#f59e0b]' : 'bg-primary'}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted">Spent</p>
                      <p className="text-sm font-semibold text-ink font-money">₹{totalThis.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">Remaining</p>
                      <p className={`text-sm font-semibold font-money ${budgetRemaining < 0 ? 'text-semantic-down' : 'text-ink'}`}>
                        ₹{Math.abs(budgetRemaining).toLocaleString('en-IN')}{budgetRemaining < 0 ? ' over' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">Daily left</p>
                      <p className="text-sm font-semibold text-ink font-money">
                        {dailyBudgetLeft != null ? `₹${dailyBudgetLeft.toLocaleString('en-IN')}` : '—'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted text-center">{daysLeft} days remaining in {now.toLocaleString('en-IN', { month: 'long' })}</p>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-ink">Set monthly budget</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-ink font-money">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 20000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 rounded-md bg-canvas-softer text-xl font-semibold text-ink placeholder-muted-soft border border-hairline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-money"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveBudget} className="flex-1 py-2.5 rounded-pill bg-primary text-white text-sm font-semibold">Save</button>
                {budget != null && (
                  <button onClick={handleClearBudget} className="py-2.5 px-4 rounded-pill bg-canvas-softer text-sm font-semibold text-semantic-down">Remove</button>
                )}
                <button onClick={() => setEditingBudget(false)} className="py-2.5 px-4 rounded-pill bg-canvas-softer text-sm font-semibold text-muted">Cancel</button>
              </div>
            </div>
          )}
        </Card>
      </Section>

      {/* Smart insights */}
      {insights.length > 0 && (
        <Section title="Smart Insights">
          <div className="flex flex-col gap-2">
            {insights.map((text, i) => (
              <Card key={i} className="flex gap-3 items-start py-3">
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-sm text-body leading-snug">{text}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
