import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import rtlPlugin from '@mui/stylis-plugin-rtl'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { prefixer } from 'stylis'

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] })
const ltrCache = createCache({ key: 'muiltr' })

export function ThemeRoot({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const rtl = locale === 'fa'

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [rtl, locale])

  const theme = useMemo(
    () =>
      createTheme({
        direction: rtl ? 'rtl' : 'ltr',
        typography: {
          fontFamily: rtl
            ? '"Vazirmatn", system-ui, sans-serif'
            : '"Inter", system-ui, sans-serif',
        },
      }),
    [rtl],
  )

  return (
    <CacheProvider value={rtl ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
