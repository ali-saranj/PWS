import { Box, Button, Card, CardContent, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBlocker, useNavigate, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { useCreateProduct, useProduct, useUpdateProduct } from '../../api/products'
import type { ProductDetailDto } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'
import { applyFieldErrors } from '../../lib/forms'
import { BasicsTab } from './BasicsTab'
import { FORM_FIELDS, SEO_FIELDS, toFormValues, toRequest, type ProductFormValues } from './productSchema'
import { SeoTab } from './SeoTab'
import { StatusControl } from './StatusControl'
import { TabPlaceholder } from './TabPlaceholder'

type TabKey = 'basics' | 'variants' | 'images' | 'seo'

interface FormProps {
  initial: ProductDetailDto | null
  reload: () => Promise<ProductDetailDto>
}

function ProductForm({ initial, reload }: FormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [detail, setDetail] = useState<ProductDetailDto | null>(initial)
  const [tab, setTab] = useState<TabKey>('basics')
  const [formError, setFormError] = useState<unknown>(null)
  const [conflict, setConflict] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [reloadError, setReloadError] = useState<unknown>(null)
  const slugTouched = useRef(initial != null)
  const leaving = useRef(false)

  const {
    register, control, handleSubmit, setError, setValue, reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({ defaultValues: toFormValues(initial) })

  const blocker = useBlocker(() => isDirty && !leaving.current)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const adopt = (d: ProductDetailDto) => {
    setDetail(d)
    reset(toFormValues(d))
  }

  const save = handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        if (detail == null) {
          const created = await create.mutateAsync(toRequest(values))
          adopt(created)
          leaving.current = true
          void navigate(`/products/${created.id}`, { replace: true })
        } else {
          adopt(await update.mutateAsync({ id: detail.id, body: toRequest(values, detail.version) }))
        }
      } catch (e) {
        if (e instanceof ApiError && e.code === 'CONFLICT') {
          setConflict(true)
        } else if (e instanceof ApiError) {
          const left = applyFieldErrors(e, setError, FORM_FIELDS)
          setFormError(left)
          if (e.fieldErrors.some((f) => SEO_FIELDS.includes(f.field)) && !e.fieldErrors.some((f) => !SEO_FIELDS.includes(f.field)))
            setTab('seo')
        } else {
          setFormError(e)
        }
      }
    },
    (invalid) => {
      if (Object.keys(invalid).every((k) => SEO_FIELDS.includes(k))) setTab('seo')
      else setTab('basics')
    },
  )

  const doReload = async () => {
    setReloading(true)
    try {
      adopt(await reload())
      setFormError(null)
      setReloadError(null)
      setConflict(false)
    } catch (e) {
      // Keep the dialog open and the user's edits untouched.
      setReloadError(e)
    } finally {
      setReloading(false)
    }
  }

  const exists = detail != null
  const saving = create.isPending || update.isPending

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">
              {detail ? detail.nameEn || detail.nameFa : t('products.create')}
            </Typography>
            <Button onClick={() => void navigate('/products')}>{t('products.backToList')}</Button>
          </Stack>
          {detail && (
            <StatusControl
              product={detail}
              dirty={isDirty}
              onChanged={(d) => {
                setDetail(d)
                qc.setQueryData(['product', d.id], d)
                reset(toFormValues(d))
              }}
            />
          )}
          <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)}>
            <Tab value="basics" label={t('products.tabs.basics')} />
            <Tab value="variants" label={t('products.tabs.variants')} disabled={!exists} />
            <Tab value="images" label={t('products.tabs.images')} disabled={!exists} />
            <Tab value="seo" label={t('products.tabs.seo')} />
          </Tabs>
          <form onSubmit={save} noValidate>
            <Stack spacing={2}>
              <ErrorAlert error={formError} />
              <Box hidden={tab !== 'basics'}>
                <BasicsTab control={control} register={register} setValue={setValue} errors={errors} slugTouched={slugTouched} />
              </Box>
              <Box hidden={tab !== 'seo'}>
                <SeoTab control={control} register={register} errors={errors} />
              </Box>
              {tab === 'variants' && <TabPlaceholder />}
              {tab === 'images' && <TabPlaceholder />}
              <Stack direction="row">
                <Button type="submit" variant="contained" disabled={saving}>
                  {t('common.save')}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </CardContent>
      <ConfirmDialog
        open={conflict}
        title={t('products.conflictTitle')}
        message={t('products.conflictMessage')}
        extra={<ErrorAlert error={reloadError} />}
        confirmLabel={t('products.reload')}
        loading={reloading}
        onConfirm={() => void doReload()}
        onCancel={() => {
          setConflict(false)
          setReloadError(null)
        }}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('products.unsavedTitle')}
        message={t('products.unsavedMessage')}
        confirmLabel={t('products.leave')}
        cancelLabel={t('products.stay')}
        destructive
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </Card>
  )
}

export default function ProductEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const productId = id == null ? undefined : Number(id)
  const { data, error, isLoading, refetch } = useProduct(productId)

  if (productId != null && isLoading) return <CircularProgress aria-label={t('common.loading')} />
  if (productId != null && !data) return <ErrorAlert error={error} />
  return <ProductForm key={data?.id ?? 'new'} initial={data ?? null} reload={async () => (await refetch({ throwOnError: true })).data!} />
}
