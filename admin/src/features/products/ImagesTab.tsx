import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DeleteIcon from '@mui/icons-material/Delete'
import { Alert, Box, Button, Card, CardContent, IconButton, LinearProgress, Stack, TextField, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { useDeleteImage, useReorderImages, useUpdateImageAlt, useUploadImage } from '../../api/images'
import { useProduct } from '../../api/products'
import type { ImageDto } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface UploadItem {
  key: number
  name: string
  status: 'uploading' | 'done' | 'error'
  message?: string
}

function ImageCard({
  image, index, count, productId, dragging, onMove, onDragStart, onDrop, onDelete,
}: {
  image: ImageDto
  index: number
  count: number
  productId: number
  dragging: boolean
  onMove: (delta: number) => void
  onDragStart: () => void
  onDrop: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const updateAlt = useUpdateImageAlt(productId)
  const [altFa, setAltFa] = useState(image.altFa ?? '')
  const [altEn, setAltEn] = useState(image.altEn ?? '')
  const [error, setError] = useState<unknown>(null)

  const saveAlt = async () => {
    if (altFa === (image.altFa ?? '') && altEn === (image.altEn ?? '')) return
    setError(null)
    try {
      await updateAlt.mutateAsync({ id: image.id, altFa: altFa.trim() || null, altEn: altEn.trim() || null })
    } catch (e) {
      setError(e)
    }
  }

  return (
    <Card
      variant="outlined"
      draggable
      data-testid={`image-${image.id}`}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      sx={{ width: 240, opacity: dragging ? 0.5 : 1 }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Box component="img" src={image.thumbUrl} alt={image.altFa ?? image.altEn ?? ''} sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <IconButton size="small" disabled={index === 0} aria-label={`${t('products.images.moveEarlier')} ${index + 1}`} onClick={() => onMove(-1)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={index === count - 1} aria-label={`${t('products.images.moveLater')} ${index + 1}`} onClick={() => onMove(1)}>
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label={`${t('common.delete')} ${index + 1}`} onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
          <TextField size="small" label={`${t('products.images.altFa')} ${index + 1}`} value={altFa} onChange={(e) => setAltFa(e.target.value)} onBlur={() => void saveAlt()} />
          <TextField size="small" label={`${t('products.images.altEn')} ${index + 1}`} value={altEn} onChange={(e) => setAltEn(e.target.value)} onBlur={() => void saveAlt()} slotProps={{ htmlInput: { dir: 'ltr' } }} />
          <ErrorAlert error={error} />
        </Stack>
      </CardContent>
    </Card>
  )
}

export function ImagesTab({ productId }: { productId: number }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'
  const { data } = useProduct(productId)
  const upload = useUploadImage(productId)
  const reorder = useReorderImages(productId)
  const remove = useDeleteImage(productId)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [order, setOrder] = useState<number[] | null>(null)
  const [reorderError, setReorderError] = useState<unknown>(null)
  const [toDelete, setToDelete] = useState<ImageDto | null>(null)
  const [deleteError, setDeleteError] = useState<unknown>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const nextKey = useRef(0)
  const input = useRef<HTMLInputElement>(null)

  const server = [...(data?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const images = order
    ? order.map((id) => server.find((i) => i.id === id)).filter((i): i is ImageDto => i != null)
    : server
  // A concurrent upload/delete changes the id set; fall back to the server order then.
  const shown = images.length === server.length ? images : server

  const patch = (key: number, p: Partial<UploadItem>) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...p } : u)))

  const errorText = (e: unknown): string => {
    if (e instanceof ApiError) return e.fieldErrors[0]?.message || e.messages[locale] || e.messages.en
    return e instanceof Error ? e.message : String(e)
  }

  const onFiles = async (files: File[]) => {
    const items = files.map((f) => ({ key: nextKey.current++, file: f }))
    setUploads((list) => [
      ...list,
      ...items.map(({ key, file }): UploadItem => {
        if (!ALLOWED_TYPES.includes(file.type)) return { key, name: file.name, status: 'error', message: t('products.images.badType') }
        if (file.size > MAX_BYTES) return { key, name: file.name, status: 'error', message: t('products.images.tooLarge') }
        return { key, name: file.name, status: 'uploading' }
      }),
    ])
    // Sequential, so sortOrder follows the selection order; a failure does not stop the rest.
    for (const { key, file } of items) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) continue
      try {
        await upload.mutateAsync(file)
        patch(key, { status: 'done' })
      } catch (e) {
        patch(key, { status: 'error', message: errorText(e) })
      }
    }
  }

  const move = async (id: number, toIndex: number) => {
    const ids = shown.map((i) => i.id)
    const from = ids.indexOf(id)
    if (from < 0 || toIndex < 0 || toIndex >= ids.length || from === toIndex) return
    ids.splice(from, 1)
    ids.splice(toIndex, 0, id)
    setReorderError(null)
    setOrder(ids)
    try {
      await reorder.mutateAsync(ids)
    } catch (e) {
      setReorderError(e)
    } finally {
      setOrder(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleteError(null)
    try {
      await remove.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch (e) {
      setDeleteError(e)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row">
        <Button variant="outlined" onClick={() => input.current?.click()}>{t('products.images.upload')}</Button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={ALLOWED_TYPES.join(',')}
          data-testid="image-input"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length > 0) void onFiles(files)
          }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary">{t('products.images.hint')}</Typography>
      {uploads.length > 0 && (
        <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {uploads.map((u) => (
            <li key={u.key}>
              <Typography variant="body2">{u.name}</Typography>
              {u.status === 'uploading' && <LinearProgress aria-label={`${t('products.images.uploading')} ${u.name}`} />}
              {u.status === 'done' && <Typography variant="caption" color="success.main">{t('products.images.uploaded')}</Typography>}
              {u.status === 'error' && <Alert severity="error">{u.message}</Alert>}
            </li>
          ))}
        </Stack>
      )}
      <ErrorAlert error={reorderError} />
      {shown.length === 0 ? (
        <Typography color="text.secondary">{t('common.empty')}</Typography>
      ) : (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 2 }}>
          {shown.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              index={i}
              count={shown.length}
              productId={productId}
              dragging={dragId === img.id}
              onMove={(d) => void move(img.id, i + d)}
              onDragStart={() => setDragId(img.id)}
              onDrop={() => {
                const id = dragId
                setDragId(null)
                if (id != null) void move(id, i)
              }}
              onDelete={() => {
                setDeleteError(null)
                setToDelete(img)
              }}
            />
          ))}
        </Stack>
      )}
      <ConfirmDialog
        open={toDelete != null}
        title={t('products.images.deleteTitle')}
        message={t('products.images.deleteMessage')}
        extra={<ErrorAlert error={deleteError} />}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </Stack>
  )
}
