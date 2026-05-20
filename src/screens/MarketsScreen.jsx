import React, { useState, useEffect, useCallback } from 'react'
import { fetchAllMarketData } from '../services/markets'
import PullToRefresh from '../components/PullToRefresh'

const GNEWS_KEY = import.meta.env.VITE_GNEWS_API_KEY || ''

function fmt(n, decimals = 0) {
  if (n == null) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function IndexCard({ name, data, nseSrc }) {
  const positive = data ? data.change >= 0 : null
  return (
    <div className="flex-1 rounded-card bg-canvas border border-hairline p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
      <p className="text-xs text-muted font-medium mb-1">{name}</p>
      {data ? (
        <>
          <p className="text-xl font-semibold text-ink font-money">{fmt(data.price)}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-semibold font-money ${positive ? 'text-semantic-up' : 'text-semantic-down'}`}>
              {positive ? '+' : ''}{fmt(data.change, 0)}
            </span>
            <span className={`text-xs font-semibold font-money ${positive ? 'text-semantic-up' : 'text-semantic-down'}`}>
              ({positive ? '+' : ''}{data.changePct != null ? data.changePct.toFixed(2) : '—'}%)
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-muted-soft font-money">—</p>
          <a href={nseSrc} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary mt-1 flex items-center gap-0.5">
            View live
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </>
      )}
    </div>
  )
}

function MetalRow({ label, value, unit = '/g' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-hairline-soft last:border-0">
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-sm font-semibold text-ink font-money">
        {value != null ? `₹${fmt(value)}${unit}` : '—'}
      </p>
    </div>
  )
}

function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-card bg-canvas border border-hairline p-3 active:bg-canvas-soft"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {article.image && (
        <img src={article.image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-canvas-softer" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink leading-snug line-clamp-2">{article.title}</p>
        <p className="text-[10px] text-muted mt-1 truncate">
          {article.source?.name} · {new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <svg className="flex-shrink-0 self-center text-muted-soft" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  )
}

const Section = ({ title, children }) => (
  <div className="flex flex-col gap-2">
    <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">{title}</p>
    {children}
  </div>
)

export default function MarketsScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await fetchAllMarketData(GNEWS_KEY)
      setData(result)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <PullToRefresh onRefresh={() => load(true)}>
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Markets</h2>
          <p className="text-xs text-muted">
            {data
              ? `Updated ${data.updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
              : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={refreshing ? 'animate-spin' : ''}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-card bg-canvas-softer h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <Section title="Indices">
            <div className="flex gap-3">
              <IndexCard name="Sensex" data={data?.indices?.sensex} nseSrc="https://www.bseindia.com" />
              <IndexCard name="Nifty 50" data={data?.indices?.nifty} nseSrc="https://www.nseindia.com" />
            </div>
          </Section>

          <Section title="Gold & Metals">
            <div className="rounded-card bg-canvas border border-hairline px-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <MetalRow label="Gold 24K" value={data?.metals?.gold24k} />
              <MetalRow label="Gold 22K" value={data?.metals?.gold22k} />
              <MetalRow label="Silver" value={data?.metals?.silverPerGram} />
            </div>
          </Section>

          <Section title="Currency">
            <div className="rounded-card bg-canvas border border-hairline px-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between py-3">
                <p className="text-sm font-medium text-ink">USD → INR</p>
                <p className="text-sm font-semibold text-ink font-money">
                  {data?.usdInr != null ? `₹${fmt(data.usdInr, 2)}` : '—'}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Finance News">
            {!GNEWS_KEY ? (
              <div className="rounded-card bg-canvas-soft p-4 text-center">
                <p className="text-sm text-muted mb-2">Add your GNews API key to see headlines.</p>
                <a href="https://gnews.io" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary">
                  Get a free key at gnews.io →
                </a>
              </div>
            ) : data?.news?.length ? (
              <div className="flex flex-col gap-2">
                {data.news.map((article, i) => <NewsCard key={i} article={article} />)}
              </div>
            ) : (
              <div className="rounded-card bg-canvas-soft p-4 text-center">
                <p className="text-sm text-muted">No recent news available. Check back later.</p>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
    </PullToRefresh>
  )
}
