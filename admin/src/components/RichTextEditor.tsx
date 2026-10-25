import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import LinkIcon from '@mui/icons-material/Link'
import { Box, FormHelperText, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  value: string
  onChange: (html: string) => void
  error?: string
}

// Only what the server's sanitiser keeps (jsoup Safelist.basic + h2/h3).
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'nofollow' } },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
  }),
]

const EMPTY = '<p></p>'

export function RichTextEditor({ label, value, onChange, error }: Props) {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions,
    content: value,
    editorProps: { attributes: { dir: 'auto', 'aria-label': label, role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === EMPTY ? '' : html)
    },
  })

  // Follow external changes (form reset after save / reload) without echoing them back as edits.
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML() === EMPTY ? '' : editor.getHTML()
    if (current !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: !!e?.isActive('bold'),
      italic: !!e?.isActive('italic'),
      h2: !!e?.isActive('heading', { level: 2 }),
      h3: !!e?.isActive('heading', { level: 3 }),
      bullet: !!e?.isActive('bulletList'),
      ordered: !!e?.isActive('orderedList'),
      link: !!e?.isActive('link'),
    }),
  })

  const tool = (name: string, on: boolean, run: () => void, icon: React.ReactNode) => (
    <Tooltip title={name}>
      <IconButton size="small" aria-label={name} aria-pressed={on} color={on ? 'primary' : 'default'} onClick={run}>
        {icon}
      </IconButton>
    </Tooltip>
  )

  const setLink = () => {
    if (!editor) return
    const url = window.prompt(t('editor.linkPrompt'), editor.getAttributes('link').href ?? 'https://')
    if (url === null) return
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <Box>
      <Typography variant="body2" color={error ? 'error' : 'text.secondary'} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ border: 1, borderColor: error ? 'error.main' : 'divider', borderRadius: 1 }}>
        <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider', p: 0.5, flexWrap: 'wrap' }}>
          {tool(t('editor.bold'), active?.bold ?? false, () => editor?.chain().focus().toggleBold().run(), <FormatBoldIcon fontSize="small" />)}
          {tool(t('editor.italic'), active?.italic ?? false, () => editor?.chain().focus().toggleItalic().run(), <FormatItalicIcon fontSize="small" />)}
          {tool(t('editor.h2'), active?.h2 ?? false, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), <Typography variant="button">H2</Typography>)}
          {tool(t('editor.h3'), active?.h3 ?? false, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), <Typography variant="button">H3</Typography>)}
          {tool(t('editor.bulletList'), active?.bullet ?? false, () => editor?.chain().focus().toggleBulletList().run(), <FormatListBulletedIcon fontSize="small" />)}
          {tool(t('editor.orderedList'), active?.ordered ?? false, () => editor?.chain().focus().toggleOrderedList().run(), <FormatListNumberedIcon fontSize="small" />)}
          {tool(t('editor.link'), active?.link ?? false, setLink, <LinkIcon fontSize="small" />)}
        </Stack>
        <Box sx={{ p: 1.5, minHeight: 140, '& .ProseMirror': { outline: 'none', minHeight: 110 } }}>
          <EditorContent editor={editor} />
        </Box>
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  )
}
