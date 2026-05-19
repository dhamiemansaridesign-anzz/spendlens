import { get, set } from 'idb-keyval'

const EXPENSES_KEY = 'spendlens_expenses'

export async function getExpenses() {
  return (await get(EXPENSES_KEY)) || []
}

export async function addExpense(expense) {
  const expenses = await getExpenses()
  const newExpense = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...expense,
  }
  await set(EXPENSES_KEY, [newExpense, ...expenses])
  return newExpense
}

export async function deleteExpense(id) {
  const expenses = await getExpenses()
  await set(EXPENSES_KEY, expenses.filter((e) => e.id !== id))
}
