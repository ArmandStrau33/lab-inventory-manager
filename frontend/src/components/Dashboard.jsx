import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Badge,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Science,
  Inventory,
  Schedule,
  CheckCircle,
  Cancel,
  Warning,
  TrendingUp,
  Notifications,
  CalendarMonth,
  Email,
  Analytics,
  ChevronRight,
  Add,
  Refresh,
  FilterList,
  Search,
  MoreVert
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { MobileDashboard } from './MobileDashboard';

const Dashboard = ({ view }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  // if parent passes a `view` prop (from App navigation), sync it
  useEffect(() => {
    if (view) setSelectedView(view);
  }, [view]);
  
  // Mock data - replace with real API calls
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRequests: 142,
      pendingApprovals: 8,
      scheduledLabs: 23,
      lowStock: 5,
      thisWeekRequests: 15,
      approvalRate: 89
    },
    recentRequests: [
      {
        id: '1',
        teacherName: 'Dr. Sarah Johnson',
        experiment: 'Chemical Equilibrium Lab',
        status: 'APPROVED',
        urgency: 'high',
        materials: ['NaCl', 'HCl', 'Beakers'],
        scheduledDate: '2025-09-03',
        lab: 'Lab A'
      },
      {
        id: '2',
        teacherName: 'Prof. Mike Chen',
        experiment: 'Organic Synthesis',
        status: 'PENDING_APPROVAL',
        urgency: 'medium',
        materials: ['Benzene', 'Catalyst', 'Glassware'],
        requestDate: '2025-08-30'
      },
      {
        id: '3',
        teacherName: 'Dr. Emma Wilson',
        experiment: 'Spectroscopy Analysis',
        status: 'INVENTORY_MISSING',
        urgency: 'low',
        materials: ['Spectrometer samples', 'Cuvettes'],
        requestDate: '2025-08-29'
      }
    ],
    inventory: [
      { material: 'NaCl', current: 45, minimum: 20, status: 'good' },
      { material: 'HCl', current: 15, minimum: 25, status: 'low' },
      { material: 'Beakers (250ml)', current: 8, minimum: 15, status: 'critical' },
      { material: 'Safety Goggles', current: 30, minimum: 20, status: 'good' }
    ],
    upcomingLabs: [
      {
        id: 'lab1',
        title: 'Advanced Biochemistry',
        teacher: 'Dr. Johnson',
        time: '09:00',
        date: '2025-09-03',
        lab: 'Lab A',
        students: 24
      },
      {
        id: 'lab2',
        title: 'Analytical Chemistry',
        teacher: 'Prof. Chen',
        time: '14:00',
        date: '2025-09-03',
        lab: 'Lab B',
        students: 18
      }
    ]
  });

  // If mobile, render mobile-optimized dashboard
  if (isMobile) {
    return <MobileDashboard dashboardData={dashboardData} />;
  }

  const statusConfig = {
    'NEW': { color: '#2196F3', bg: '#E3F2FD', icon: Add },
    'APPROVED': { color: '#4CAF50', bg: '#E8F5E8', icon: CheckCircle },
    'PENDING_APPROVAL': { color: '#FF9800', bg: '#FFF3E0', icon: Schedule },
    'REJECTED': { color: '#F44336', bg: '#FFEBEE', icon: Cancel },
    'INVENTORY_MISSING': { color: '#9C27B0', bg: '#F3E5F5', icon: Warning },
    'SCHEDULED': { color: '#00BCD4', bg: '#E0F2F1', icon: CalendarMonth }
  };

  const urgencyColors = {
    high: '#F44336',
    medium: '#FF9800',
    low: '#4CAF50'
  };

  const chartData = [
    { name: 'Approved', value: 89, color: '#4CAF50' },
    { name: 'Pending', value: 8, color: '#FF9800' },
    { name: 'Rejected', value: 3, color: '#F44336' }
  ];

  const weeklyData = [
    { day: 'Mon', requests: 12, approvals: 10 },
    { day: 'Tue', requests: 15, approvals: 14 },
    { day: 'Wed', requests: 8, approvals: 7 },
    { day: 'Thu', requests: 18, approvals: 16 },
    { day: 'Fri', requests: 22, approvals: 19 },
    { day: 'Sat', requests: 5, approvals: 5 },
    { day: 'Sun', requests: 3, approvals: 3 }
  ];

  const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <Card 
      sx={{ 
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}25`
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="h6" color="text.primary" fontWeight="600">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon fontSize="large" />
          </Avatar>
        </Box>
        {trend && (
          <Box mt={2} display="flex" alignItems="center">
            <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
            <Typography variant="body2" color="success.main">
              +{trend}% from last week
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const RequestCard = ({ request }) => {
    const config = statusConfig[request.status];
    const StatusIcon = config.icon;
    
    return (
      <Card 
        sx={{ 
          mb: 2, 
          borderRadius: 3,
          border: `2px solid ${config.color}20`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateX(8px)',
            boxShadow: `0 4px 20px ${config.color}30`
          },
          cursor: 'pointer'
        }}
        onClick={() => setSelectedRequest(request)}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: config.bg, color: config.color, mr: 2 }}>
                <StatusIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {request.experiment}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.teacherName}
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Chip 
                label={request.status.replace('_', ' ')}
                sx={{ 
                  bgcolor: config.bg, 
                  color: config.color,
                  fontWeight: 'bold',
                  mb: 1
                }}
              />
              <Box>
                <Chip 
                  size="small"
                  label={request.urgency}
                  sx={{ 
                    bgcolor: `${urgencyColors[request.urgency]}20`,
                    color: urgencyColors[request.urgency],
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Materials: {request.materials.join(', ')}
            </Typography>
            <IconButton size="small" sx={{ color: config.color }}>
              <ChevronRight />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const InventoryCard = ({ item }) => {
    const percentage = (item.current / item.minimum) * 100;
    const getStatusColor = () => {
      if (item.status === 'critical') return '#F44336';
      if (item.status === 'low') return '#FF9800';
      return '#4CAF50';
    };

    return (
      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="600">
              {item.material}
            </Typography>
            <Chip 
              label={item.status.toUpperCase()}
              sx={{ 
                bgcolor: `${getStatusColor()}20`,
                color: getStatusColor(),
                fontWeight: 'bold'
              }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Current: {item.current}</Typography>
            <Typography variant="body2">Min: {item.minimum}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: `${getStatusColor()}20`,
              '& .MuiLinearProgress-bar': {
                bgcolor: getStatusColor(),
                borderRadius: 4
              }
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight="bold" color="primary.main" mb={1}>
          Lab Management Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          Microsoft Automation Pipeline Control Center
        </Typography>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          {['overview', 'requests', 'inventory', 'calendar', 'analytics'].map((view) => (
            <Button
              key={view}
              variant={selectedView === view ? 'contained' : 'outlined'}
              onClick={() => setSelectedView(view)}
              sx={{ 
                borderRadius: 3,
                textTransform: 'capitalize',
                fontWeight: 'bold'
              }}
            >
              {view}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Total Requests"
            value={dashboardData.stats.totalRequests}
            subtitle="This month"
            icon={Science}
            color="#2196F3"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Pending Approvals"
            value={dashboardData.stats.pendingApprovals}
            subtitle="Awaiting action"
            icon={Schedule}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Scheduled Labs"
            value={dashboardData.stats.scheduledLabs}
            subtitle="This week"
            icon={CalendarMonth}
            color="#4CAF50"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Low Stock Items"
            value={dashboardData.stats.lowStock}
            subtitle="Need attention"
            icon={Warning}
            color="#F44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Approval Rate"
            value={`${dashboardData.stats.approvalRate}%`}
            subtitle="This month"
            icon={CheckCircle}
            color="#9C27B0"
            trend={3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Weekly Requests"
            value={dashboardData.stats.thisWeekRequests}
            subtitle="This week"
            icon={TrendingUp}
            color="#00BCD4"
            trend={15}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid - render sections conditionally depending on selectedView */}
      <Grid container spacing={3}>
        {/* Recent Requests - shown for overview and requests view */}
        {['overview', 'requests'].includes(selectedView) && (
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    Recent Requests
                  </Typography>
                  <Box>
                    <IconButton>
                      <FilterList />
                    </IconButton>
                    <IconButton>
                      <Refresh />
                    </IconButton>
                  </Box>
                </Box>
                {dashboardData.recentRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Charts and Analytics - shown for overview and analytics view */}
        {['overview', 'analytics'].includes(selectedView) && (
          <Grid item xs={12} lg={6}>
            <Grid container spacing={3}>
              {/* Approval Status Pie Chart */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      Request Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Weekly Trends */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      Weekly Activity
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="requests" stackId="1" stroke="#2196F3" fill="#2196F3" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="approvals" stackId="1" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* Inventory Status - shown for overview and inventory view */}
        {['overview', 'inventory'].includes(selectedView) && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    Inventory Status
                  </Typography>
                  <Badge badgeContent={dashboardData.stats.lowStock} color="error">
                    <Inventory />
                  </Badge>
                </Box>
                {dashboardData.inventory.map((item, index) => (
                  <InventoryCard key={index} item={item} />
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Upcoming Labs - shown for overview and calendar view */}
        {['overview', 'calendar'].includes(selectedView) && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Upcoming Lab Sessions
                </Typography>
                {dashboardData.upcomingLabs.map((lab) => (
                  <Card 
                    key={lab.id} 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {lab.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {lab.teacher} • {lab.students} students
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight="bold">
                            {lab.time}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {lab.lab}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Request Details Dialog */}
      <Dialog 
        open={!!selectedRequest} 
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ 
                  bgcolor: statusConfig[selectedRequest.status].bg, 
                  color: statusConfig[selectedRequest.status].color,
                  mr: 2 
                }}>
                  <Science />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedRequest.experiment}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRequest.teacherName}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">STATUS</Typography>
                  <Chip 
                    label={selectedRequest.status.replace('_', ' ')}
                    sx={{ 
                      bgcolor: statusConfig[selectedRequest.status].bg,
                      color: statusConfig[selectedRequest.status].color,
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  />
                  
                  <Typography variant="subtitle2" color="text.secondary">MATERIALS</Typography>
                  <Box mb={2}>
                    {selectedRequest.materials.map((material, index) => (
                      <Chip key={index} label={material} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">URGENCY</Typography>
                  <Chip 
                    label={selectedRequest.urgency.toUpperCase()}
                    sx={{ 
                      bgcolor: `${urgencyColors[selectedRequest.urgency]}20`,
                      color: urgencyColors[selectedRequest.urgency],
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  />
                  
                  {selectedRequest.scheduledDate && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">SCHEDULED</Typography>
                      <Typography variant="body1">
                        {selectedRequest.scheduledDate} • {selectedRequest.lab}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedRequest(null)}>Close</Button>
              <Button variant="contained">View Details</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;

// TODOs:
// - Replace mock `dashboardData` with real API calls to /api/dashboard or Firestore
// - Add polling or WebSocket to refresh stats in real-time
// - Add actions for Approve/Reject that call Functions endpoints
// - Add unit tests for key UI components (React Testing Library)
// NEXT ACTION (ROADMAP):
// 1) Implement a small `api/dashboard` Express endpoint returning minimal stats and wire it here.
// 2) Add Approve/Reject buttons that POST to `/api/requests/:id/approve` and `/api/requests/:id/reject`.
