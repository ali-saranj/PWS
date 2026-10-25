import { Container, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

// Placeholder: routing, auth and layout arrive in Task 16.
export default function App() {
  const { t } = useTranslation()
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5">{t('app.title')}</Typography>
    </Container>
  )
}
