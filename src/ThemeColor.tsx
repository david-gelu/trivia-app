import { useEffect, useState } from 'react'

const ThemeColor = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('dark-mode')
    const preferredTheme = savedTheme === 'enabled'
      ? 'dark'
      : savedTheme === 'disabled'
        ? 'light'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    localStorage.setItem('dark-mode', preferredTheme === 'dark' ? 'enabled' : 'disabled')
    setTheme(preferredTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    setTheme(nextTheme)
    localStorage.setItem('dark-mode', nextTheme === 'dark' ? 'enabled' : 'disabled')

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        document.documentElement.setAttribute('data-theme', nextTheme)
      })
    } else {
      document.documentElement.setAttribute('data-theme', nextTheme)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}

export default ThemeColor
