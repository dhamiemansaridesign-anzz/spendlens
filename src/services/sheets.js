const HEADERS = ['Date', 'Amount', 'Category', 'Note', 'Payment Mode', 'Timestamp']
const TAB = 'Expenses'

// ── Create a new spreadsheet in the user's Drive ───────────────────────────
export async function createUserSheet(accessToken, title = 'SpendLens - My Expenses') {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: TAB, index: 0 } }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Sheet creation failed: ${res.status}`)
  }
  const data = await res.json()
  return data.spreadsheetId
}

// ── Write column headers if the sheet is empty ─────────────────────────────
export async function ensureSheetHeaders(accessToken, sheetId) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TAB}!A1:F1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (!data.values?.length) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TAB}!A1:F1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [HEADERS] }),
      }
    )
  }
}

// ── Append one expense row ─────────────────────────────────────────────────
export async function appendExpense(accessToken, sheetId, expense) {
  const date = new Date(expense.createdAt)
  const row = [
    date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    expense.amount,
    expense.category,
    expense.note || '',
    expense.paymentMethod,
    expense.createdAt,
  ]

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TAB}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Sheets error ${res.status}`)
  }
  return res.json()
}
