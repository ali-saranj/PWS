import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { setLocale } from '../i18n'
import { navItems } from './nav'

const DRAWER_WIDTH = 240

function isActive(path: string, pathname: string): boolean {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')
}

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { staff, signOut } = useAuth()
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const locale = i18n.language === 'en' ? 'en' : 'fa'

  const items = navItems.filter((i) => staff && i.roles.includes(staff.role))

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          {t('app.title')}
        </Typography>
      </Toolbar>
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.key}
            component={Link}
            to={item.path}
            selected={isActive(item.path, pathname)}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={t(`nav.${item.key}`)} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}>
          {drawerContent}
        </Drawer>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky">
          <Toolbar>
            {!desktop && (
              <IconButton color="inherit" edge="start" aria-label={t('nav.menu')} onClick={() => setOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button color="inherit" onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')} aria-label={t('common.language')}>
              {locale === 'fa' ? 'EN' : 'فا'}
            </Button>
            <Typography sx={{ mx: 2 }} noWrap>
              {staff?.fullName}
            </Typography>
            <IconButton color="inherit" aria-label={t('auth.logout')} onClick={() => void signOut()}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
