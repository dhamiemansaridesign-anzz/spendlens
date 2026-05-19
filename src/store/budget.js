import { get, set, del } from 'idb-keyval'

const KEY = 'spendlens_budget'

export async function getMonthlyBudget() {
  return get(KEY)
}

export async function setMonthlyBudget(amount) {
  return set(KEY, Number(amount))
}

export async function clearMonthlyBudget() {
  return del(KEY)
}
