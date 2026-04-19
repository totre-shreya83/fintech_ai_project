import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Button,
  Tooltip as MuiTooltip,
  useTheme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
  LinearProgress,
  Badge,
  Fade,
  Grow,
  alpha,
  ButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Refresh,
  Dashboard as DashboardIcon,
  Assessment,
  NotificationsActive,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline,
  ArrowUpward,
  ArrowDownward,
  Download,
  FilterList,
  DarkMode,
  LightMode,
  Search,
  Business,
  Person,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { fetchStats, fetchEvents, fetchCriticalEvents, fetchEventHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';

// 🎯 USER TYPES WITH THEIR SECTORS
const userTypes = [
  {
    id: 'bank',
    label: '🏦 Banking',
    sectors: ['Banking', 'NBFC', 'Financial Services', 'Audit Firms', 'Credit Rating'],
  },
  {
    id: 'fintech',
    label: '💳 Fintech',
    sectors: ['Fintech', 'Payments', 'Digital Lending', 'Regulatory'],
  },
  {
    id: 'it',
    label: '💻 IT & Tech',
    sectors: ['Technology', 'IT Services', 'Software', 'Consulting', 'Cloud Computing'],
  },
  {
    id: 'manufacturing',
    label: '🏭 Manufacturing',
    sectors: ['Auto', 'Industrial', 'Manufacturing', 'Commodities'],
  },
  {
    id: 'telecom',
    label: '📱 Telecom',
    sectors: ['Telecom', 'Infrastructure', 'Broadband', '5G'],
  },
  {
    id: 'retail',
    label: '🛍️ Retail',
    sectors: ['Retail', 'E-commerce', 'Consumer Goods'],
  },
  {
    id: 'healthcare',
    label: '⚕️ Healthcare',
    sectors: ['Pharmaceuticals', 'Healthcare', 'Biotech'],
  },
  {
    id: 'energy',
    label: '⚡ Energy',
    sectors: ['Energy', 'Oil & Gas', 'Power', 'Renewables'],
  },
  {
    id: 'realestate',
    label: '🏢 Real Estate',
    sectors: ['Real Estate', 'Housing Finance', 'Construction'],
  },
];

// 🎯 SECTOR IMPACT PREDICTION
const predictSectorImpact = (event) => {
  const sectorMap = {
    'fraud': ['Banking', 'Financial Services', 'Audit Firms', 'Technology', 'Consulting'],
    'merger': ['Banking', 'Technology', 'Consulting', 'Fintech', 'Retail'],
    'earnings': ['Banking', 'NBFC', 'Insurance', 'Technology', 'Manufacturing'],
    'monetary_policy': ['Banking', 'NBFC', 'Housing Finance', 'Auto', 'Real Estate'],
    'regulatory': ['Banking', 'Fintech', 'Telecom', 'Healthcare', 'Energy'],
    'credit_rating': ['Banking', 'Corporate', 'Bond Markets', 'NBFC'],
    'bankruptcy': ['Banking', 'Retail', 'Manufacturing', 'Technology'],
    'legal': ['Banking', 'Legal Services', 'Corporate', 'Technology'],
    'macro_event': ['All Sectors', 'Markets'],
    'geopolitical': ['Energy', 'Defense', 'Commodities', 'Technology'],
  };
  return sectorMap[event.event_type] || ['General'];
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, preferences } = useAuth();

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [criticalEvents, setCriticalEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [days, setDays] = useState(7);
  
  // 👤 USER PERSONALIZATION
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || 'bank';
  });
  const [viewMode, setViewMode] = useState('sector');
  
  // 🚨 CRITICAL ALERTS PAGINATION
  const [showAllCritical, setShowAllCritical] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('userType', userType);
  }, [userType]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [statsData, eventsData, criticalData, historyData] = await Promise.all([
        fetchStats(),
        fetchEvents(),
        fetchCriticalEvents(),
        fetchEventHistory(days)
      ]);

      setStats(statsData);
      setEvents(eventsData.events || []);
      setCriticalEvents(criticalData.events || []);
      setHistory(historyData.timeline || []);
      
      // Reset show all when new data loads
      setShowAllCritical(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [days]);

  // 🎯 FILTER EVENTS BASED ON VIEW MODE
  const getFilteredEvents = () => {
    if (viewMode === 'all') {
      return events;
    }

    const currentUser = userTypes.find(u => u.id === userType);
    const userSectors = currentUser?.sectors || [];

    return events.filter(event => {
      const sectors = predictSectorImpact(event);
      return sectors.some(sector => userSectors.includes(sector));
    });
  };

  const filteredEvents = getFilteredEvents();
  
  const filteredCriticalEvents = viewMode === 'all'
    ? criticalEvents
    : criticalEvents.filter(event => {
        const currentUser = userTypes.find(u => u.id === userType);
        const userSectors = currentUser?.sectors || [];
        const sectors = predictSectorImpact(event);
        return sectors.some(sector => userSectors.includes(sector));
      });

  const getFilteredStats = () => {
    if (viewMode === 'all' || !stats) return stats;

    const filtered = filteredEvents;
    const critical = filtered.filter(e => e.risk_level === 'critical').length;
    const high = filtered.filter(e => e.risk_level === 'high').length;
    const medium = filtered.filter(e => e.risk_level === 'medium').length;
    const low = filtered.filter(e => e.risk_level === 'low').length;

    return {
      total_events: filtered.length,
      risk_distribution: { critical, high, medium, low },
      event_type_distribution: stats?.event_type_distribution || []
    };
  };

  const filteredStats = getFilteredStats();

  const getFilteredEventTypes = () => {
    const eventCount = {};
    filteredEvents.forEach(event => {
      if (event.event_type) {
        eventCount[event.event_type] = (eventCount[event.event_type] || 0) + 1;
      }
    });

    return Object.entries(eventCount).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  };

  const filteredEventTypes = getFilteredEventTypes();

  const getFilteredHistory = () => {
    if (viewMode === 'all') return history;
    
    return history.map(day => ({
      ...day,
      critical: Math.floor(day.critical * 0.3),
      high: Math.floor(day.high * 0.4),
      medium: Math.floor(day.medium * 0.5),
      low: Math.floor(day.low * 0.6)
    }));
  };

  const filteredHistory = getFilteredHistory();

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getRiskHexColor = (risk, isDark = darkMode) => {
    switch (risk) {
      case 'critical': return isDark ? '#ff6b6b' : '#d32f2f';
      case 'high': return isDark ? '#ffb74d' : '#ed6c02';
      case 'medium': return isDark ? '#64b5f6' : '#0288d1';
      case 'low': return isDark ? '#81c784' : '#2e7d32';
      default: return isDark ? '#b0bec5' : '#757575';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <Warning />;
      case 'medium': return <Info />;
      case 'low': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const searchedEvents = filteredEvents.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // Theme colors
  const bgColor = darkMode ? '#0a1929' : '#f8fafc';
  const paperBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#475569';
  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const hoverBg = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';

  const customTooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: bgColor }}>
        <Paper elevation={darkMode ? 4 : 1} sx={{ p: 4, borderRadius: 3, bgcolor: paperBg, color: textColor, textAlign: 'center', maxWidth: 400 }}>
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 600, color: textColor }}>
            Financial Risk Intelligence
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: textSecondary }}>
            Loading dashboard...
          </Typography>
        </Paper>
      </Box>
    );
  }

  const currentUser = userTypes.find(u => u.id === userType);

  return (
    <Fade in={animate} timeout={800}>
      <Box sx={{ bgcolor: bgColor, minHeight: '100vh', py: 4, transition: 'background-color 0.3s ease' }}>
        <Container maxWidth="xl">
          {/* 🎯 HEADER */}
          <Grow in={animate} timeout={600}>
            <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                    <DashboardIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="700" sx={{ color: textColor }}>
                      Financial Risk Intelligence
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      {viewMode === 'sector' 
                        ? `${currentUser?.label} • ${filteredEvents.length} domain events` 
                        : `All Sectors • ${events.length} total events`}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      sx={{
                        bgcolor: hoverBg,
                        color: textColor,
                        borderRadius: 2,
                      }}
                      startAdornment={<Person sx={{ mr: 1, color: textSecondary }} />}
                    >
                      {userTypes.map(type => (
                        <MenuItem key={type.id} value={type.id}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ color: textSecondary }}>
                    {darkMode ? <LightMode /> : <DarkMode />}
                  </IconButton>

                  <IconButton onClick={() => navigate('/settings')} sx={{ color: textSecondary }}>
                    <SettingsIcon />
                  </IconButton>

                  <Badge badgeContent={filteredCriticalEvents.length} color="error">
                    <IconButton sx={{ color: textSecondary }}>
                      <NotificationsActive />
                    </IconButton>
                  </Badge>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      sx={{ bgcolor: hoverBg, color: textColor, borderRadius: 2 }}
                    >
                      <MenuItem value={7}>Last 7 days</MenuItem>
                      <MenuItem value={14}>Last 14 days</MenuItem>
                      <MenuItem value={30}>Last 30 days</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={loadData}
                    disabled={refreshing}
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </Box>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 40, height: 40 }}>
                    👤
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: textSecondary }}>
                      Logged in as
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ color: textColor }}>
                      {user?.name || 'User'} • {currentUser?.label}
                    </Typography>
                  </Box>
                </Box>

                <ButtonGroup variant="outlined" size="large">
                  <Button
                    onClick={() => setViewMode('sector')}
                    variant={viewMode === 'sector' ? 'contained' : 'outlined'}
                    startIcon={<Business />}
                    sx={{ px: 3, py: 1 }}
                  >
                    {currentUser?.label} Sector ({filteredEvents.length})
                  </Button>
                  <Button
                    onClick={() => setViewMode('all')}
                    variant={viewMode === 'all' ? 'contained' : 'outlined'}
                    startIcon={<DashboardIcon />}
                    sx={{ px: 3, py: 1 }}
                  >
                    All Events ({events.length})
                  </Button>
                </ButtonGroup>
              </Box>
            </Paper>
          </Grow>

          {/* 📊 STATS CARDS */}
          <Grid container spacing={3} mb={4}>
            {[
              {
                label: 'Total Events',
                value: filteredStats?.total_events || 0,
                icon: <Assessment />,
                color: theme.palette.primary.main,
                subtitle: viewMode === 'sector' ? 'In your sector' : 'All sectors'
              },
              {
                label: 'Critical Risk',
                value: filteredStats?.risk_distribution?.critical || 0,
                icon: <ErrorIcon />,
                color: getRiskHexColor('critical'),
                subtitle: 'Immediate action'
              },
              {
                label: 'High Risk',
                value: filteredStats?.risk_distribution?.high || 0,
                icon: <Warning />,
                color: getRiskHexColor('high'),
                subtitle: 'Monitor closely'
              },
              {
                label: 'Low/Medium',
                value: (filteredStats?.risk_distribution?.medium || 0) + (filteredStats?.risk_distribution?.low || 0),
                icon: <CheckCircle />,
                color: getRiskHexColor('low'),
                subtitle: 'Normal activity'
              },
            ].map((card, index) => (
              <Grow in={animate} timeout={500 + index * 100} key={card.label}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={darkMode ? 4 : 1} sx={{
                    borderRadius: 3,
                    bgcolor: paperBg,
                    border: `1px solid ${borderColor}`,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="overline" sx={{ color: textSecondary }}>
                            {card.label}
                          </Typography>
                          <Typography variant="h3" fontWeight="700" sx={{ color: textColor, mt: 1 }}>
                            {card.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 1 }}>
                            {card.subtitle}
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: alpha(card.color, 0.1), color: card.color }}>
                          {card.icon}
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grow>
            ))}
          </Grid>

          {/* 📊 CHARTS */}
          <Grid container spacing={3} mb={4}>
            {/* RISK DISTRIBUTION */}
            <Grid item xs={12} md={6}>
              <Grow in={animate} timeout={900}>
                <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PieChartIcon sx={{ color: textSecondary }} />
                      <Typography variant="h6" fontWeight="600" sx={{ color: textColor }}>
                        Risk Distribution
                      </Typography>
                    </Box>
                    <Chip
                      label={viewMode === 'sector' ? `${currentUser?.label}` : 'All Sectors'}
                      size="small"
                      color={viewMode === 'sector' ? 'primary' : 'default'}
                    />
                  </Box>
                  <Divider sx={{ mb: 2, borderColor }} />
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Critical', value: filteredStats?.risk_distribution?.critical || 0 },
                          { name: 'High', value: filteredStats?.risk_distribution?.high || 0 },
                          { name: 'Medium', value: filteredStats?.risk_distribution?.medium || 0 },
                          { name: 'Low', value: filteredStats?.risk_distribution?.low || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill={getRiskHexColor('critical')} />
                        <Cell fill={getRiskHexColor('high')} />
                        <Cell fill={getRiskHexColor('medium')} />
                        <Cell fill={getRiskHexColor('low')} />
                      </Pie>
                      <RechartsTooltip contentStyle={customTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box display="flex" justifyContent="center" gap={3} mt={2}>
                    {['Critical', 'High', 'Medium', 'Low'].map((level) => (
                      <Box key={level} display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: getRiskHexColor(level.toLowerCase()) }} />
                        <Typography variant="caption" sx={{ color: textSecondary }}>{level}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grow>
            </Grid>

            {/* EVENTS BY TYPE */}
            <Grid item xs={12} md={6}>
              <Grow in={animate} timeout={1000}>
                <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BarChartIcon sx={{ color: textSecondary }} />
                      <Typography variant="h6" fontWeight="600" sx={{ color: textColor }}>
                        Events by Type
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor }} />
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={filteredEventTypes.slice(0, 6)}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                      <XAxis dataKey="type" tick={{ fontSize: 11, fill: textSecondary }} />
                      <YAxis tick={{ fontSize: 11, fill: textSecondary }} />
                      <RechartsTooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grow>
            </Grid>

            {/* TREND CHART */}
            <Grid item xs={12}>
              <Grow in={animate} timeout={1100}>
                <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timeline sx={{ color: textSecondary }} />
                      <Typography variant="h6" fontWeight="600" sx={{ color: textColor }}>
                        Risk Trends ({days} days) • {viewMode === 'sector' ? currentUser?.label : 'All Sectors'}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor }} />
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={filteredHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: textSecondary }} />
                      <YAxis tick={{ fontSize: 11, fill: textSecondary }} />
                      <RechartsTooltip contentStyle={customTooltipStyle} />
                      <Legend />
                      <Area type="monotone" dataKey="critical" stroke={getRiskHexColor('critical')} fill={alpha(getRiskHexColor('critical'), 0.1)} />
                      <Area type="monotone" dataKey="high" stroke={getRiskHexColor('high')} fill={alpha(getRiskHexColor('high'), 0.1)} />
                      <Area type="monotone" dataKey="medium" stroke={getRiskHexColor('medium')} fill={alpha(getRiskHexColor('medium'), 0.1)} />
                      <Area type="monotone" dataKey="low" stroke={getRiskHexColor('low')} fill={alpha(getRiskHexColor('low'), 0.1)} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* 🚨 CRITICAL ALERTS - WITH SEE MORE BUTTON */}
          {filteredCriticalEvents.length > 0 && (
            <Box mb={4}>
              <Grow in={animate} timeout={1200}>
                <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${alpha(getRiskHexColor('critical'), 0.3)}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Badge badgeContent={filteredCriticalEvents.length} color="error">
                        <Avatar sx={{ bgcolor: alpha(getRiskHexColor('critical'), 0.1), color: getRiskHexColor('critical') }}>
                          <NotificationsActive />
                        </Avatar>
                      </Badge>
                      <Typography variant="h6" fontWeight="600" sx={{ color: getRiskHexColor('critical') }}>
                        Critical Alerts • {viewMode === 'sector' ? currentUser?.label : 'All Sectors'}
                      </Typography>
                    </Box>
                    
                    {/* SEE MORE / SHOW LESS BUTTON */}
                    {filteredCriticalEvents.length > 3 && (
                      <Button
                        size="small"
                        onClick={() => setShowAllCritical(!showAllCritical)}
                        sx={{ 
                          color: getRiskHexColor('critical'),
                          borderColor: getRiskHexColor('critical'),
                          '&:hover': { 
                            borderColor: getRiskHexColor('critical'), 
                            bgcolor: alpha(getRiskHexColor('critical'), 0.05) 
                          }
                        }}
                        variant="outlined"
                        endIcon={showAllCritical ? <ArrowUpward /> : <ArrowDownward />}
                      >
                        {showAllCritical ? 'Show Less' : `See All (${filteredCriticalEvents.length})`}
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ mb: 2, borderColor }} />
                  
                  <Grid container spacing={2}>
                    {/* SHOW FIRST 3 OR ALL BASED ON STATE */}
                    {(showAllCritical ? filteredCriticalEvents : filteredCriticalEvents.slice(0, 3)).map((event) => (
                      <Grid item xs={12} key={event.id}>
                        <Alert
                          severity="error"
                          icon={<ErrorIcon />}
                          sx={{
                            borderRadius: 2,
                            bgcolor: alpha(getRiskHexColor('critical'), 0.05),
                            border: `1px solid ${alpha(getRiskHexColor('critical'), 0.2)}`,
                          }}
                        >
                          <AlertTitle sx={{ fontWeight: 600, color: getRiskHexColor('critical') }}>
                            {event.title}
                          </AlertTitle>
                          <Typography variant="body2" sx={{ color: textSecondary }}>
                            <strong>Type:</strong> {event.event_type} • <strong>Source:</strong> {event.source} • {new Date(event.published_at).toLocaleString()}
                          </Typography>
                        </Alert>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* FOOTER WITH COUNT - Show when not expanded and there are more alerts */}
                  {!showAllCritical && filteredCriticalEvents.length > 3 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Button
                        size="small"
                        onClick={() => setShowAllCritical(true)}
                        sx={{ color: getRiskHexColor('critical') }}
                        endIcon={<ArrowDownward />}
                      >
                        +{filteredCriticalEvents.length - 3} more alerts
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Box>
          )}

          {/* 📋 EVENTS TABLE - NO LIMIT! */}
          <Grow in={animate} timeout={1300}>
            <Paper elevation={darkMode ? 4 : 1} sx={{ p: 3, borderRadius: 3, bgcolor: paperBg, border: `1px solid ${borderColor}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Assessment sx={{ color: textSecondary }} />
                  <Typography variant="h6" fontWeight="600" sx={{ color: textColor }}>
                    {viewMode === 'sector' ? `${currentUser?.label} Events` : 'All Events'} • {filteredEvents.length} total
                  </Typography>
                </Box>

                <Box display="flex" gap={2} alignItems="center">
                  <Paper elevation={0} sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', bgcolor: hoverBg, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
                    <Search sx={{ p: 1, color: textSecondary }} />
                    <input
                      placeholder="Search in current view..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        padding: '8px',
                        color: textColor,
                        width: '250px',
                      }}
                    />
                  </Paper>
                  <Chip
                    label={`${searchedEvents.length} events`}
                    size="small"
                    sx={{ bgcolor: hoverBg, color: textColor }}
                  />
                </Box>
              </Box>
              <Divider sx={{ mb: 2, borderColor }} />

              {/* TABLE - NO SLICE, ALL EVENTS! */}
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Event Type</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Risk Level</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Affected Sectors</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Confidence</TableCell>
                      <TableCell sx={{ bgcolor: paperBg, color: textColor, fontWeight: 600 }}>Published</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchedEvents.length > 0 ? (
                      searchedEvents.map((event) => {
                        const sectors = predictSectorImpact(event);
                        return (
                          <TableRow key={event.id} hover sx={{ '&:hover': { bgcolor: hoverBg } }}>
                            <TableCell sx={{ color: textColor, maxWidth: 300 }}>
                              <Typography noWrap variant="body2">
                                {event.title}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: textSecondary }}>{event.source}</TableCell>
                            <TableCell>
                              <Chip
                                label={event.event_type}
                                size="small"
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getRiskIcon(event.risk_level)}
                                label={event.risk_level?.toUpperCase()}
                                size="small"
                                sx={{ bgcolor: alpha(getRiskHexColor(event.risk_level), 0.1), color: getRiskHexColor(event.risk_level) }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: textSecondary }}>
                              <Typography variant="caption">
                                {sectors.slice(0, 2).join(', ')}{sectors.length > 2 ? '...' : ''}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ width: 50 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={event.confidence || 0}
                                    sx={{
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: alpha(getRiskHexColor(event.risk_level), 0.1),
                                      '& .MuiLinearProgress-bar': { bgcolor: getRiskHexColor(event.risk_level) }
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: textSecondary }}>
                                  {event.confidence || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ color: textSecondary }}>
                                {event.published_at ? new Date(event.published_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography variant="body1" sx={{ color: textSecondary }}>
                            No events found in {viewMode === 'sector' ? 'your sector' : 'all events'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textSecondary }}>
                            Try switching to {viewMode === 'sector' ? 'All Events' : 'your sector'} view
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grow>

          {/* FOOTER */}
          <Box mt={4} textAlign="center">
            <Typography variant="caption" sx={{ color: textSecondary, opacity: 0.8 }}>
              Financial Risk Intelligence Platform • {viewMode === 'sector' ? currentUser?.label : 'All Sectors'} • {filteredEvents.length} events • Updated {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Fade>
  );
};

export default Dashboard;