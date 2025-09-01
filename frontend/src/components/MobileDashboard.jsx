import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Science,
  Schedule,
  CheckCircle,
  Warning,
  TrendingUp
} from '@mui/icons-material';

const MobileStatsCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
        borderRadius: 3,
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${color}25`
        }
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            <Typography variant="body1" color="text.primary" fontWeight="600">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            <Icon />
          </Avatar>
        </Box>
        {trend && (
          <Box mt={1} display="flex" alignItems="center">
            <TrendingUp sx={{ color: '#4CAF50', mr: 0.5, fontSize: 16 }} />
            <Typography variant="caption" color="success.main">
              +{trend}% this week
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MobileRequestCard = ({ request }) => {
  const statusConfig = {
    'NEW': { color: '#2196F3', bg: '#E3F2FD', icon: Science },
    'APPROVED': { color: '#4CAF50', bg: '#E8F5E8', icon: CheckCircle },
    'PENDING_APPROVAL': { color: '#FF9800', bg: '#FFF3E0', icon: Schedule },
    'REJECTED': { color: '#F44336', bg: '#FFEBEE', icon: Warning },
    'INVENTORY_MISSING': { color: '#9C27B0', bg: '#F3E5F5', icon: Warning },
    'SCHEDULED': { color: '#00BCD4', bg: '#E0F2F1', icon: Schedule }
  };

  const urgencyColors = {
    high: '#F44336',
    medium: '#FF9800',
    low: '#4CAF50'
  };

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
          transform: 'translateX(4px)',
          boxShadow: `0 4px 15px ${config.color}30`
        }
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <Avatar sx={{ bgcolor: config.bg, color: config.color, mr: 2, width: 40, height: 40 }}>
              <StatusIcon fontSize="small" />
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                {request.experiment}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {request.teacherName}
              </Typography>
            </Box>
          </Box>
          <Box textAlign="right">
            <Chip 
              label={request.status.replace('_', ' ')}
              size="small"
              sx={{ 
                bgcolor: config.bg, 
                color: config.color,
                fontWeight: 'bold',
                mb: 0.5,
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {request.materials.slice(0, 2).join(', ')}
            {request.materials.length > 2 && '...'}
          </Typography>
          <Chip 
            size="small"
            label={request.urgency}
            sx={{ 
              bgcolor: `${urgencyColors[request.urgency]}20`,
              color: urgencyColors[request.urgency],
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const MobileInventoryCard = ({ item }) => {
  const percentage = (item.current / item.minimum) * 100;
  const getStatusColor = () => {
    if (item.status === 'critical') return '#F44336';
    if (item.status === 'low') return '#FF9800';
    return '#4CAF50';
  };

  return (
    <Card sx={{ borderRadius: 3, mb: 2 }}>
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
            {item.material}
          </Typography>
          <Chip 
            size="small"
            label={item.status.toUpperCase()}
            sx={{ 
              bgcolor: `${getStatusColor()}20`,
              color: getStatusColor(),
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="caption">Current: {item.current}</Typography>
          <Typography variant="caption">Min: {item.minimum}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: `${getStatusColor()}20`,
            '& .MuiLinearProgress-bar': {
              bgcolor: getStatusColor(),
              borderRadius: 3
            }
          }}
        />
      </CardContent>
    </Card>
  );
};

const MobileDashboard = ({ dashboardData }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Mobile Stats Grid */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <MobileStatsCard
            title="Requests"
            value={dashboardData.stats.totalRequests}
            subtitle="Total"
            icon={Science}
            color="#2196F3"
            trend={12}
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatsCard
            title="Pending"
            value={dashboardData.stats.pendingApprovals}
            subtitle="Approvals"
            icon={Schedule}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatsCard
            title="Scheduled"
            value={dashboardData.stats.scheduledLabs}
            subtitle="This week"
            icon={CheckCircle}
            color="#4CAF50"
            trend={8}
          />
        </Grid>
        <Grid item xs={6}>
          <MobileStatsCard
            title="Low Stock"
            value={dashboardData.stats.lowStock}
            subtitle="Items"
            icon={Warning}
            color="#F44336"
          />
        </Grid>
      </Grid>

      {/* Recent Requests */}
      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Requests
        </Typography>
        {dashboardData.recentRequests.map((request) => (
          <MobileRequestCard key={request.id} request={request} />
        ))}
      </Box>

      {/* Inventory Status */}
      <Box>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Inventory Status
        </Typography>
        {dashboardData.inventory.map((item, index) => (
          <MobileInventoryCard key={index} item={item} />
        ))}
      </Box>
    </Box>
  );
};

export { MobileDashboard, MobileStatsCard, MobileRequestCard, MobileInventoryCard };

// TODOs:
// - Wire mobile actions to backend APIs
// - Ensure accessibility and large touch targets
// - Add snapshot tests for visual regression
