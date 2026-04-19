import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchEvents = async () => {
  try {
    const response = await api.get('/events/');
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { events: [], total: 0 };
  }
};

export const fetchStats = async () => {
  try {
    const response = await api.get('/events/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      total_events: 0,
      risk_distribution: { critical: 0, high: 0, medium: 0, low: 0 },
      event_type_distribution: []
    };
  }
};

export const fetchCriticalEvents = async () => {
  try {
    const response = await api.get('/events/critical');
    return response.data;
  } catch (error) {
    console.error('Error fetching critical events:', error);
    return { events: [], total: 0 };
  }
};

export const fetchEventHistory = async (days = 7) => {
  try {
    const response = await api.get(`/events/history?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event history:', error);
    return { timeline: [], days, total_events: 0 };
  }
};

export default api;