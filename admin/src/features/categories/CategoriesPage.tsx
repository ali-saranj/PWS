import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, Stack, Tooltip, Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategories, useDeleteCategory } from '../../api/categories'
import type { CategoryDto } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorAlert } from '../../components/ErrorAlert'
import { buildTree, type CategoryNode } from './buildTree'
import { CategoryDialog } from './CategoryDialog'

type DialogState = { category: CategoryDto | null; parentId: number | null } | null

export default function CategoriesPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useCategories()
  const del = useDeleteCategory()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toDelete, setToDelete] = useState<CategoryDto | null>(null)
  const tree = useMemo(() => buildTree(data ?? []), [data])

  const renderNode = (node: CategoryNode, depth: number) => (
    <Box key={node.id}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', py: 0.5, paddingInlineStart: `${depth * 24}px`, borderBottom: 1, borderColor: 'divider' }}
        data-testid={`category-row-${node.id}`}
      >
        <Typography sx={{ flexGrow: 1 }}>
          {node.nameFa}
          {node.nameEn && (
            <Typography component="span" color="text.secondary" sx={{ marginInlineStart: 1 }} dir="ltr">
              {node.nameEn}
            </Typography>
          )}
        </Typography>
        {!node.active && <Chip size="small" label={t('common.inactive')} />}
        <Tooltip title={t('categories.addChild')}>
          <IconButton
            aria-label={`${t('categories.addChild')}: ${node.nameFa}`}
            onClick={() => setDialog({ category: null, parentId: node.id })}
          >
            <SubdirectoryArrowRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.edit')}>
          <IconButton
            aria-label={`${t('common.edit')}: ${node.nameFa}`}
            onClick={() => setDialog({ category: node, parentId: node.parentId })}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.delete')}>
          <IconButton aria-label={`${t('common.delete')}: ${node.nameFa}`} onClick={() => setToDelete(node)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      {node.children.map((c) => renderNode(c, depth + 1))}
    </Box>
  )

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('categories.title')}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ category: null, parentId: null })}>
            {t('categories.add')}
          </Button>
        </Stack>
        <ErrorAlert error={error ?? del.error} />
        {isLoading && <CircularProgress aria-label={t('common.loading')} />}
        {data && tree.length === 0 && <Typography color="text.secondary">{t('common.empty')}</Typography>}
        {tree.map((n) => renderNode(n, 0))}
      </CardContent>
      {dialog && (
        <CategoryDialog
          category={dialog.category}
          defaultParentId={dialog.parentId}
          all={data ?? []}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        open={toDelete != null}
        title={t('categories.deleteTitle')}
        message={t('categories.deleteMessage', { name: toDelete?.nameFa })}
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
