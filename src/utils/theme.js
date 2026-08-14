const STORAGE_KEY = 'outil-plan-reseau:theme'

// null = pas de préférence explicite, suit prefers-color-scheme (voir tokens.css).
export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY)
}

export function applyTheme(theme) {
  if (theme) {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  } else {
    delete document.documentElement.dataset.theme
    localStorage.removeItem(STORAGE_KEY)
  }
}

// À appeler au démarrage, avant le montage, pour éviter un flash du mauvais thème.
export function initTheme() {
  const stored = getStoredTheme()
  if (stored) document.documentElement.dataset.theme = stored
}

export function effectiveTheme() {
  return (
    document.documentElement.dataset.theme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
}
