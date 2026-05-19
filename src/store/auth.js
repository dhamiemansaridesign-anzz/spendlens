import { get, set, del } from 'idb-keyval'

const AUTH_KEY = 'spendlens_auth'
const TOKEN_KEY = 'spendlens_token'

export async function getAuthUser() {
  return get(AUTH_KEY)
}

export async function setAuthUser(user) {
  return set(AUTH_KEY, user)
}

export async function clearAuthUser() {
  return del(AUTH_KEY)
}

export async function getAccessToken() {
  const data = await get(TOKEN_KEY)
  if (!data) return null
  if (Date.now() > data.expiry) {
    await del(TOKEN_KEY)
    return null
  }
  return data.token
}

export async function setAccessToken(token, expiresIn) {
  return set(TOKEN_KEY, { token, expiry: Date.now() + expiresIn * 1000 })
}

export async function clearAccessToken() {
  return del(TOKEN_KEY)
}
