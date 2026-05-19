import { get, set } from 'idb-keyval'

const KEY = 'spendlens_custom_categories'

export async function getCustomCategories() {
  return (await get(KEY)) || []
}

export async function addCustomCategory(cat) {
  const list = await getCustomCategories()
  const newCat = { id: `custom_${Date.now()}`, ...cat }
  await set(KEY, [...list, newCat])
  return newCat
}

export async function removeCustomCategory(id) {
  const list = await getCustomCategories()
  await set(KEY, list.filter((c) => c.id !== id))
}
