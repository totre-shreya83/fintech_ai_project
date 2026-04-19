import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormLabel,
  IconButton,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save,
  Add,
  Delete,
  Business,
  Logout as LogoutIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Settings = () => {
  const { user, preferences, updatePreferences, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    user_type: 'bank',
    risk_threshold: 'medium',
    tracked_companies: [],
    email_alerts: 0,
    dark_mode: 0,
  });
  
  const [newCompany, setNewCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preferences) {
      setFormData({
        user_type: preferences.user_type || 'bank',
        risk_threshold: preferences.risk_threshold || 'medium',
        tracked_companies: preferences.tracked_companies || [],
        email_alerts: preferences.email_alerts || 0,
        dark_mode: preferences.dark_mode || 0,
      });
    }
  }, [preferences]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCompany = () => {
    if (newCompany.trim() && !formData.tracked_companies.includes(newCompany.trim())) {
      setFormData({
        ...formData,
        tracked_companies: [...formData.tracked_companies, newCompany.trim()],
      });
      setNewCompany('');
    }
  };

  const handleRemoveCompany = (company) => {
    setFormData({
      ...formData,
      tracked_companies: formData.tracked_companies.filter((c) => c !== company),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const result = await updatePreferences(formData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userTypes = [
    { id: 'bank', label: '🏦 Banking & Financial Services' },
    { id: 'fintech', label: '💳 Fintech & Payments' },
    { id: 'it', label: '💻 IT & Technology' },
    { id: 'manufacturing', label: '🏭 Manufacturing' },
    { id: 'healthcare', label: '⚕️ Healthcare & Pharma' },
    { id: 'retail', label: '🛍️ Retail & E-commerce' },
    { id: 'energy', label: '⚡ Energy & Oil' },
    { id: 'telecom', label: '📱 Telecom' },
    { id: 'realestate', label: '🏢 Real Estate' },
    { id: 'other', label: '📊 Other' },
  ];

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Back to Dashboard Button */}
        <Box mb={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'text.secondary' }}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="700">
                Settings
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage your account preferences
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Preferences updated successfully!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={4}>
            {/* User Info Card */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: '#f8fafc', p: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Company:</strong> {user.company || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Member since:</strong>{' '}
                    {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                  <Button
  variant="outlined"
  color="primary"
  fullWidth
  startIcon={<AssessmentIcon />}
  onClick={() => navigate('/reports')}
  sx={{ mt: 2 }}
>
  Reports & Analytics
</Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ mt: 3 }}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Preferences Form */}
            <Grid item xs={12} md={8}>
              <form onSubmit={handleSubmit}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Industry & Risk Preferences
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Industry / Sector</InputLabel>
                  <Select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                    label="Industry / Sector"
                  >
                    {userTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Risk Threshold</FormLabel>
                  <RadioGroup
                    name="risk_threshold"
                    value={formData.risk_threshold}
                    onChange={handleChange}
                    row
                  >
                    <FormControlLabel value="low" control={<Radio />} label="Low" />
                    <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                    <FormControlLabel value="high" control={<Radio />} label="High" />
                    <FormControlLabel value="critical" control={<Radio />} label="Critical" />
                  </RadioGroup>
                </FormControl>

                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                  Tracked Companies
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Add companies you want to monitor closely
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., HDFC Bank, Reliance, TCS"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddCompany}
                    startIcon={<Add />}
                    disabled={!newCompany.trim()}
                  >
                    Add
                  </Button>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                  {formData.tracked_companies.map((company) => (
                    <Chip
                      key={company}
                      label={company}
                      onDelete={() => handleRemoveCompany(company)}
                      deleteIcon={<Delete />}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                  {formData.tracked_companies.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No companies tracked. Add companies to filter events.
                    </Typography>
                  )}
                </Box>

                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                  Notifications
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.email_alerts === 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email_alerts: e.target.checked ? 1 : 0,
                        })
                      }
                    />
                  }
                  label="Email Alerts"
                  sx={{ mb: 2, display: 'block' }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;