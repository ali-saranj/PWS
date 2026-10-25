import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import UploadIcon from '@mui/icons-material/Upload'
import {
  Avatar, Button, Card, CardContent, Chip, CircularProgress, IconButton, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBrands, useDeleteBrand, useUploadBrandLogo } from '../../api/brands'
import type { BrandDto } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'
import { BrandDialog } from './BrandDialog'

const MAX_LOGO_BYTES = 5 * 1024 * 1024

export default function BrandsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useBrands()
  const del = useDeleteBrand()
  const upload = useUploadBrandLogo()
  const [dialog, setDialog] = useState<{ brand: BrandDto | null } | null>(null)
  const [toDelete, setToDelete] = useState<BrandDto | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const onFile = (brand: BrandDto, file: File | undefined) => {
    if (!file) return
    setLocalError(null)
    upload.reset()
    if (file.size > MAX_LOGO_BYTES) {
      setLocalError(t('brands.fileTooLarge'))
      return
    }
    upload.mutate({ id: brand.id, file })
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('brands.title')}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ brand: null })}>
            {t('brands.add')}
          </Button>
        </Stack>
        <Stack spacing={1} sx={{ mb: 1 }}>
          <ErrorAlert error={error ?? del.error ?? upload.error ?? (localError ? new Error(localError) : null)} />
        </Stack>
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && data.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {data && data.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('brands.logo')}</TableCell>
                <TableCell>{t('form.nameFa')}</TableCell>
                <TableCell>{t('form.nameEn')}</TableCell>
                <TableCell>{t('form.slug')}</TableCell>
                <TableCell>{t('form.active')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Avatar variant="rounded" src={b.logoUrl ?? undefined} alt={b.logoUrl ? b.nameFa : t('brands.noLogo')}>
                      {b.nameFa.slice(0, 1)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{b.nameFa}</TableCell>
                  <TableCell dir="ltr" align="left">{b.nameEn}</TableCell>
                  <TableCell dir="ltr" align="left">{b.slug}</TableCell>
                  <TableCell>
                    <Chip size="small" color={b.active ? 'success' : 'default'} label={b.active ? t('common.active') : t('common.inactive')} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title={t('brands.uploadLogo')}>
                      <IconButton component="label" aria-label={`${t('brands.uploadLogo')}: ${b.nameFa}`} disabled={upload.isPending}>
                        <UploadIcon fontSize="small" />
                        <input
                          hidden
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          data-testid={`logo-input-${b.id}`}
                          onChange={(e) => {
                            onFile(b, e.target.files?.[0])
                            e.target.value = ''
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton aria-label={`${t('common.edit')}: ${b.nameFa}`} onClick={() => setDialog({ brand: b })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton aria-label={`${t('common.delete')}: ${b.nameFa}`} onClick={() => setToDelete(b)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {dialog && <BrandDialog brand={dialog.brand} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={toDelete != null}
        title={t('brands.deleteTitle')}
        message={t('brands.deleteMessage', { name: toDelete?.nameFa })}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })
        }}
      />
    </Card>
  )
}
