import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { login, verify } from '../api/auth'
import type { LoginChallenge } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { toLatinDigits } from '../lib/format'
import { useAuth } from './AuthContext'

function returnPath(state: unknown): string {
  const from = (state as { from?: { pathname?: string; search?: string } } | null)?.from
  if (from?.pathname && from.pathname !== '/login') return from.pathname + (from.search ?? '')
  return '/'
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { staff, signIn } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null)

  const loginMutation = useMutation({
    mutationFn: () => login(username.trim(), password),
    onSuccess: (c) => {
      setChallenge(c)
      setCode('')
    },
  })
  const verifyMutation = useMutation({
    mutationFn: (c: LoginChallenge) => verify(c.challenge, toLatinDigits(code).trim()),
    onSuccess: (s) => signIn(s),
  })

  if (staff) return <Navigate to={returnPath(location.state)} replace />

  const pending = loginMutation.isPending || verifyMutation.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (challenge) verifyMutation.mutate(challenge)
    else loginMutation.mutate()
  }

  const back = () => {
    setChallenge(null)
    setCode('')
    verifyMutation.reset()
    loginMutation.reset()
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submit} noValidate>
            <Typography variant="h5">{t('auth.title')}</Typography>
            {challenge ? (
              <>
                <Typography color="text.secondary">
                  {t('auth.codeSent', { mobile: challenge.mobileMasked })}
                </Typography>
                <TextField
                  label={t('auth.code')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  slotProps={{
                    htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', dir: 'ltr' },
                  }}
                />
                <ErrorAlert error={verifyMutation.error} />
                <Button type="submit" variant="contained" disabled={pending}>
                  {t('auth.verify')}
                </Button>
                <Button type="button" onClick={back} disabled={pending}>
                  {t('auth.back')}
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label={t('auth.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  slotProps={{ htmlInput: { dir: 'ltr' } }}
                />
                <TextField
                  label={t('auth.password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  slotProps={{ htmlInput: { dir: 'ltr' } }}
                />
                <ErrorAlert error={loginMutation.error} />
                <Button type="submit" variant="contained" disabled={pending}>
                  {t('auth.signIn')}
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
