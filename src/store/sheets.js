import { get, set, del } from 'idb-keyval'

// Sheet ID is stored per user so each account keeps their own sheet
function key(userId) {
  return `spendlens_sheet_${userId}`
}

export async function getUserSheetId(userId) {
  return get(key(userId))
}

export async function setUserSheetId(userId, sheetId) {
  return set(key(userId), sheetId)
}

export async function clearUserSheetId(userId) {
  return del(key(userId))
}
