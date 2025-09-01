import React, { useState } from 'react'
import { 
  Container, 
  Typography, 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material'
import { 
  Dashboard as DashboardIcon, 
  Add, 
  Menu as MenuIcon,
  Science,
  Analytics,
  Inventory,
  Schedule
} from '@mui/icons-material'
import IntakeForm from './components/IntakeForm'
import Dashboard from './components/Dashboard'

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
})

export default function App(){
  const [currentView, setCurrentView] = useState('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'intake', label: 'New Request', icon: Add },
    { id: 'analytics', label: 'Analytics', icon: Analytics },
    { id: 'inventory', label: 'Inventory', icon: Inventory },
    { id: 'schedule', label: 'Schedule', icon: Schedule },
  ]

  const renderCurrentView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard view="overview" />
      case 'analytics':
        return <Dashboard view="analytics" />
      case 'inventory':
        return <Dashboard view="inventory" />
      case 'schedule':
        return <Dashboard view="calendar" />
      case 'intake':
        return (
          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              p: 4,
              mb: 4,
              color: 'white',
              textAlign: 'center'
            }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Submit New Lab Request
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Request lab materials and schedule your experiment
              </Typography>
            </Box>
            <IntakeForm />
          </Container>
        )
      default:
        return <Dashboard view="overview" />
    }
  }

  const drawer = (
    <Box sx={{ width: 250, mt: 8 }}>
      <List>
        {navigationItems.map((item) => (
          <ListItem 
            button 
            key={item.id}
            onClick={() => {
              setCurrentView(item.id)
              setDrawerOpen(false)
            }}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 1,
              backgroundColor: currentView === item.id ? 'primary.main' : 'transparent',
              color: currentView === item.id ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: currentView === item.id ? 'primary.dark' : 'grey.100',
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: currentView === item.id ? 'white' : 'primary.main',
              minWidth: 40 
            }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: currentView === item.id ? 'bold' : 'medium' 
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Science sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Lab Management System
            </Typography>
            {!isMobile && navigationItems.map((item) => (
              <Button
                key={item.id}
                color="inherit"
                startIcon={<item.icon />}
                onClick={() => setCurrentView(item.id)}
                sx={{
                  mx: 1,
                  backgroundColor: currentView === item.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Toolbar>
        </AppBar>

        {isMobile ? (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              width: 250,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 250,
                boxSizing: 'border-box',
                borderRight: 'none',
                backgroundColor: '#fafafa',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}

        <Box component="main" sx={{ flexGrow: 1, width: isMobile ? '100%' : 'calc(100% - 250px)' }}>
          <Toolbar />
          {renderCurrentView()}
        </Box>
      </Box>
    </ThemeProvider>
  )
}

// TODOs:
// - Add route-based code splitting for large dashboard
// - Add accessibility checks and aria labels for Drawer and AppBar
// - Wire navigation items to dedicated routes and lazy-load pages
// - Add unit tests for navigation and view rendering
// NEXT ACTION (ROADMAP):
// 1) Replace view-switch with React Router and lazy-load Dashboard and IntakeForm as separate chunks.
// 2) Add ARIA attributes and run axe-core accessibility checks in CI.
