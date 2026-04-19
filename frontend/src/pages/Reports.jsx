import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Chip,
  Switch,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf,
  TableChart,
  Schedule,
  Email,
  Download,
  Delete,
  Refresh,
  Assessment,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Reports = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [reportType, setReportType] = useState('pdf');
  const [days, setDays] = useState(7);
  const [frequency, setFrequency] = useState('daily');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [scheduledReports, setScheduledReports] = useState([]);

  // Load scheduled reports
  React.useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/reports/scheduled');
      setScheduledReports(response.data.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/reports/csv?days=${days}`);
      
      // Download CSV file
      const blob = new Blob([response.data.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      
      setSuccess(`CSV report exported successfully! (${response.data.count} events)`);
    } catch (err) {
      setError('Failed to export CSV');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/reports/pdf?days=${days}`, {
        responseType: 'blob'
      });
      
      // Download PDF file
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk_report_${days}days.pdf`;
      a.click();
      
      setSuccess('PDF report exported successfully!');
    } catch (err) {
      setError('Failed to export PDF');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Schedule Report
  const handleSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/reports/schedule', {
        type: reportType,
        frequency,
        email,
        days
      });
      
      if (response.data.success) {
        setSuccess(`Report scheduled: ${frequency}`);
        fetchScheduledReports();
      }
    } catch (err) {
      setError('Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (frequency) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/reports/schedule/${frequency}`);
      setSuccess(`Schedule ${frequency} deleted`);
      fetchScheduledReports();
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Box mb={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/settings')}
            sx={{ color: 'text.secondary' }}
          >
            Back to Settings
          </Button>
        </Box>

        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Assessment />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="700">
                Reports & Analytics
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Export data and schedule automated reports
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={4}>
            {/* Export Section */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: '#f8fafc', p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  <Download sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Export Data
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Download events data in your preferred format
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Time Period</InputLabel>
                  <Select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    label="Time Period"
                  >
                    <MenuItem value={7}>Last 7 days</MenuItem>
                    <MenuItem value={14}>Last 14 days</MenuItem>
                    <MenuItem value={30}>Last 30 days</MenuItem>
                    <MenuItem value={90}>Last 90 days</MenuItem>
                  </Select>
                </FormControl>

                <Box display="flex" gap={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TableChart />}
                    onClick={handleExportCSV}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    CSV
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PictureAsPdf />}
                    onClick={handleExportPDF}
                    disabled={loading}
                    sx={{ py: 1.5, bgcolor: '#dc3545', '&:hover': { bgcolor: '#bb2d3b' } }}
                  >
                    PDF
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Schedule Section */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: '#f8fafc', p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Schedule Reports
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Set up automated reports to your inbox
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    <MenuItem value="pdf">PDF Report (with charts)</MenuItem>
                    <MenuItem value="csv">CSV Data Export</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily (8:00 AM)</MenuItem>
                    <MenuItem value="weekly">Weekly (Monday 8:00 AM)</MenuItem>
                    <MenuItem value="monthly">Monthly (1st day, 8:00 AM)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Schedule />}
                  onClick={handleSchedule}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  Schedule Report
                </Button>
              </Card>
            </Grid>

            {/* Scheduled Reports List */}
            {scheduledReports.length > 0 && (
              <Grid item xs={12}>
                <Card elevation={0} sx={{ bgcolor: '#f8fafc', p: 3 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Active Schedules
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scheduledReports.map((report, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip
                                icon={report.type === 'pdf' ? <PictureAsPdf /> : <TableChart />}
                                label={report.type.toUpperCase()}
                                size="small"
                                color={report.type === 'pdf' ? 'error' : 'primary'}
                              />
                            </TableCell>
                            <TableCell>{report.frequency}</TableCell>
                            <TableCell>{report.email}</TableCell>
                            <TableCell>Last {report.days} days</TableCell>
                            <TableCell>
                              <Chip label="Active" size="small" color="success" />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Delete Schedule">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteSchedule(report.frequency)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Reports;