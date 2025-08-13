import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { dashboardAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [conditionDistribution, setConditionDistribution] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [criticalTools, setCriticalTools] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, statusRes, conditionRes, activitiesRes, criticalRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getStatusDistribution(),
        dashboardAPI.getConditionDistribution(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getCriticalTools(),
      ]);

      setStats(statsRes.data);
      setStatusDistribution(statusRes.data);
      setConditionDistribution(conditionRes.data);
      setRecentActivities(activitiesRes.data);
      setCriticalTools(criticalRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {value || 0}
            </Typography>
          </Box>
          <Box sx={{ color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.title')}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.totalTools')}
            value={stats.totalTools}
            icon={<BuildIcon fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.availableTools')}
            value={stats.availableTools}
            icon={<CheckCircleIcon fontSize="large" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.inUseTools')}
            value={stats.inUseTools}
            icon={<BuildIcon fontSize="large" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.maintenanceTools')}
            value={stats.maintenanceTools}
            icon={<WarningIcon fontSize="large" />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.upcomingMaintenance')}
            value={stats.upcomingMaintenance}
            icon={<WarningIcon fontSize="large" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={t('dashboard.overdueMaintenance')}
            value={stats.overdueMaintenance}
            icon={<ErrorIcon fontSize="large" />}
            color="#f44336"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.toolStatusDistribution')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.toolConditionDistribution')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conditionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.condition}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {conditionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.recentActivities')}
            </Typography>
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${activity.tool_code} - ${activity.name}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {activity.type === 'usage' ? 'Used by' : 'Maintained by'} {activity.user}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={activity.type}
                    color={activity.type === 'usage' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.criticalTools')}
            </Typography>
            <List>
              {criticalTools.map((tool, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${tool.tool_code} - ${tool.name}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Condition: {tool.condition}
                        </Typography>
                        {tool.next_maintenance && (
                          <>
                            <br />
                            <Typography component="span" variant="caption">
                              Next maintenance: {new Date(tool.next_maintenance).toLocaleDateString()}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                  <Chip
                    label={tool.priority === 3 ? 'Critical' : tool.priority === 2 ? 'High' : 'Medium'}
                    color={tool.priority === 3 ? 'error' : tool.priority === 2 ? 'warning' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;