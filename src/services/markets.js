const TROY_OZ_TO_GRAMS = 31.1035
const CORS_PROXY = 'https://corsproxy.io/?url='

function proxied(url) {
  return CORS_PROXY + encodeURIComponent(url)
}

// ── USD/INR ────────────────────────────────────────────────────────────────
export async function fetchUsdInr() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) throw new Error('Exchange rate unavailable')
  const data = await res.json()
  return data.rates?.INR ?? null
}

// ── Yahoo Finance chart — generic quote via CORS proxy ─────────────────────
async function yahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const res = await fetch(proxied(url))
  if (!res.ok) throw new Error(`Yahoo ${symbol}: ${res.status}`)
  const data = await res.json()

  // Log meta so field names are visible in the browser console
  const meta = data.chart?.result?.[0]?.meta
  console.log(`[Markets] Yahoo ${symbol} meta:`, meta)

  if (!meta?.regularMarketPrice) throw new Error(`No price for ${symbol}`)

  const price = meta.regularMarketPrice
  // chart API uses chartPreviousClose, not previousClose
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null
  const change = prevClose != null ? price - prevClose : (meta.regularMarketChange ?? null)
  const changePct =
    prevClose != null
      ? ((price - prevClose) / prevClose) * 100
      : (meta.regularMarketChangePercent ?? null)

  return { price, change, changePct }
}

// ── Sensex + Nifty 50 ──────────────────────────────────────────────────────
export async function fetchIndices() {
  const [sensex, nifty] = await Promise.allSettled([
    yahooQuote('^BSESN'),
    yahooQuote('^NSEI'),
  ])
  return {
    sensex: sensex.status === 'fulfilled' ? sensex.value : null,
    nifty: nifty.status === 'fulfilled' ? nifty.value : null,
  }
}

// ── Gold & Silver — primary: Swissquote XAU/INR + XAG/INR ─────────────────
async function fetchMetalsPrimary() {
  const url =
    'https://forex-data-feed.swissquote.com/public-community-quotes?currencyPairs=XAU/INR,XAG/INR'
  const res = await fetch(proxied(url))
  if (!res.ok) throw new Error(`Swissquote: ${res.status}`)
  const raw = await res.json()
  console.log('[Markets] Swissquote response:', raw)

  const quotes = Array.isArray(raw) ? raw : Object.values(raw)

  function mid(q) {
    if (!q) return null
    if (q.ask != null && q.bid != null) return (q.ask + q.bid) / 2
    return q.ask ?? q.bid ?? q.price ?? null
  }

  const goldQ = quotes.find((q) => (q.currencyPair ?? q.symbol ?? '').includes('XAU'))
  const silverQ = quotes.find((q) => (q.currencyPair ?? q.symbol ?? '').includes('XAG'))

  const goldInr = mid(goldQ)
  const silverInr = mid(silverQ)

  if (!goldInr) throw new Error('No XAU/INR price in Swissquote response')

  return {
    gold24k: Math.round(goldInr / TROY_OZ_TO_GRAMS),
    gold22k: Math.round((goldInr / TROY_OZ_TO_GRAMS) * 0.9167),
    silverPerGram: silverInr ? Math.round(silverInr / TROY_OZ_TO_GRAMS) : null,
  }
}

// ── Gold & Silver — fallback: Yahoo Finance GC=F / SI=F in USD × USD/INR ──
async function fetchMetalsFallback(usdInr) {
  console.log('[Markets] Falling back to Yahoo Finance for metals')
  const [goldRes, silverRes] = await Promise.allSettled([
    yahooQuote('GC=F'),
    yahooQuote('SI=F'),
  ])
  const goldUsd = goldRes.status === 'fulfilled' ? goldRes.value.price : null
  const silverUsd = silverRes.status === 'fulfilled' ? silverRes.value.price : null
  return {
    gold24k: goldUsd ? Math.round((goldUsd / TROY_OZ_TO_GRAMS) * usdInr) : null,
    gold22k: goldUsd ? Math.round((goldUsd / TROY_OZ_TO_GRAMS) * usdInr * 0.9167) : null,
    silverPerGram: silverUsd ? Math.round((silverUsd / TROY_OZ_TO_GRAMS) * usdInr) : null,
  }
}

export async function fetchMetals(usdInr) {
  try {
    return await fetchMetalsPrimary()
  } catch (err) {
    console.warn('[Markets] Swissquote failed:', err.message)
    return fetchMetalsFallback(usdInr)
  }
}

// ── Finance news ───────────────────────────────────────────────────────────
export async function fetchNews(apiKey) {
  if (!apiKey) return []
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const from = weekAgo.toISOString().slice(0, 10)
  const res = await fetch(
    `https://gnews.io/api/v4/search?q=india+economy+stock+market&lang=en&country=in&max=5&sortby=publishedAt&from=${from}&apikey=${apiKey}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.articles || []).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

// ── Aggregate ──────────────────────────────────────────────────────────────
export async function fetchAllMarketData(gnewsKey) {
  const usdInr = await fetchUsdInr().catch(() => null)
  const [indicesRes, metalsRes, newsRes] = await Promise.allSettled([
    fetchIndices(),
    usdInr ? fetchMetals(usdInr) : Promise.resolve({ gold24k: null, gold22k: null, silverPerGram: null }),
    fetchNews(gnewsKey),
  ])
  return {
    usdInr,
    indices: indicesRes.status === 'fulfilled' ? indicesRes.value : { sensex: null, nifty: null },
    metals: metalsRes.status === 'fulfilled' ? metalsRes.value : { gold24k: null, gold22k: null, silverPerGram: null },
    news: newsRes.status === 'fulfilled' ? newsRes.value : [],
    updatedAt: new Date(),
  }
}
