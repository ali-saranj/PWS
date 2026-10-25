import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

type Kind = 'added' | 'removed' | 'changed'

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => Object.hasOwn(b, k) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/** Strings render as-is, everything else as compact JSON. Always returned as text, never as HTML. */
function show(v: unknown): string {
  return typeof v === 'string' ? v : JSON.stringify(v)
}

export function JsonDiff({ before, after }: { before: unknown; after: unknown }) {
  const { t } = useTranslation()
  const b = asRecord(before)
  const a = asRecord(after)
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])]
  const rows = keys.flatMap((key) => {
    const inB = Object.hasOwn(b, key)
    const inA = Object.hasOwn(a, key)
    const kind: Kind | null = !inB ? 'added' : !inA ? 'removed' : deepEqual(b[key], a[key]) ? null : 'changed'
    return kind ? [{ key, kind }] : []
  })

  if (rows.length === 0) return <Typography color="text.secondary">{t('audit.noChanges')}</Typography>

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{t('audit.field')}</TableCell>
          <TableCell>{t('audit.before')}</TableCell>
          <TableCell>{t('audit.after')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(({ key, kind }) => (
          <TableRow key={key} data-testid={`diff-${key}`} data-kind={kind}>
            <TableCell dir="ltr" sx={{ textAlign: 'start' }}>{key}</TableCell>
            <TableCell sx={{ bgcolor: kind === 'added' ? undefined : 'error.light' }}>
              {kind !== 'added' && <Box component="code" dir="ltr" sx={{ wordBreak: 'break-all' }}>{show(b[key])}</Box>}
            </TableCell>
            <TableCell sx={{ bgcolor: kind === 'removed' ? undefined : 'success.light' }}>
              {kind !== 'removed' && <Box component="code" dir="ltr" sx={{ wordBreak: 'break-all' }}>{show(a[key])}</Box>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
